import bcrypt from 'bcrypt'
import escapeStringRegexp from 'escape-string-regexp'
import express from 'express'
import { body } from 'express-validator'
import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { fsApiKeys, jwtSecret, prisma, dbEnabled, restrictedUsernames, adminRank } from '../index.js'
import authorize from '../lib/authorize-func.js'
import validateErrors from '../lib/validate.js'
import log from '../lib/log.js'

const router = express.Router()

const matchPassword = async (username: string, password: string) => {
  const existingMatch = await prisma.user.findFirst({ where: { username: username.trim() } })
  if (!existingMatch) return false

  const bcryptMatch = await bcrypt.compare(password, existingMatch.password)
  if (!bcryptMatch) return false

  return existingMatch
}

//TODO: set cookie and jwt expiry
//* User account management
router.post(
  '/register', 
  body('username', 'Username must be between 4-16 characters long').isString().isLength({ min: 4, max: 16 }),
  body('password', 'Password must be between 6-24 characters long').isString().isLength({ min: 6, max: 24 }),
  validateErrors,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const { username, password } = req.body
    if (restrictedUsernames.includes(username.trim().toLowerCase())) 
      return res.status(400).send('That username is restricted')

    try {
      const existingMatch = await prisma.user.findFirst({ where: { username: username } })
      if (existingMatch) return res.status(409).send('That username has been taken')

      const hashedPassword = await bcrypt.hash(password, 10)
      const defaultPerms = {
        "makedir": false,
        "upload": false,
        "rename": false,
        "copy": false,
        "move": false,
        "delete": false,
      }
      const jti = uuidv4()

      const response = await prisma.user.create({
        data: {
          ip_address: req.clientIp,
          username: username.trim(),
          password: hashedPassword,
          rank: 0,
          permissions: JSON.stringify(defaultPerms),
          created_at: new Date(),
          jti: jti
        }
      })

      const token = jwt.sign({ 
        username,
        rank: 0,
        permissions: defaultPerms,
        jti
      }, jwtSecret)
      res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })

      log(`Register account request received from ${req.clientIp}`)
      return res.sendStatus(200)
    } catch (err) {
      console.error(err)
      return res.status(500).send(err)
    }
  }
)

router.post(
  '/login',
  body('username').isString(),
  body('password').isString(),
  validateErrors,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const { username, password } = req.body

    try {
      const bcryptMatch = await matchPassword(username, password)
      if (!bcryptMatch) return res.status(401).send('Wrong username or password')

      const token = jwt.sign({
        username,
        rank: bcryptMatch.rank,
        permissions: JSON.parse(bcryptMatch.permissions),
        jti: bcryptMatch.jti
      }, jwtSecret)

      //* Update IP address on login
      await prisma.user.update({
        where: { username: username },
        data: { ip_address: req.clientIp }
      })
      
      res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })

      log(`Login request received from ${req.clientIp}`)
      return res.sendStatus(200)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  }
)

router.delete(
  '/delete',
  body('username').isString(),
  body('password').isString(),
  validateErrors,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const { username, password } = req.body

    try {
      const bcryptMatch = await matchPassword(username, password)
      if (!bcryptMatch) return res.status(400).send('Wrong username or password')

      res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })

      await prisma.user.delete({ where: { username: username.trim() } })

      log(`Delete account request received from ${req.clientIp}`)
      return res.sendStatus(200)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  }
)

//* Admin controls
router.get(
  '/user',
  authorize,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    if (!req.jwt) return res.sendStatus(401)
    const { user } = req.query
    const { rank } = req.jwt
    if (user && typeof user != 'string') return res.sendStatus(400)
    //* Must be admin rank to query other users
    if (!rank || rank < adminRank) return res.sendStatus(403)

    const options = {
      projection: { _id: 0, password: 0 },
    }

    try {
      if (!user) {
        const queryAll = await prisma.user.findMany({ 
          where: {
            id: {
              gt: 0
            }
          }
        })
        const queryAllExclude = queryAll.map(userData => exclude(userData, ['password']))
        return res.status(200).send(parsePermissions(queryAllExclude))
      }
      
      const queryString = await prisma.user.findMany({ 
        where: { 
          username: { 
            contains: user as string
          } 
        } 
      })
      const queryStringExclude = queryString.map(userData => exclude(userData, ['password']))
      return res.status(200).send(parsePermissions(queryStringExclude))
    } catch (err) {
      console.error(err)
      return res.status(500).send(err)
    }
  }
)

router.patch(
  '/user/:username/modify',
  authorize,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const userToModify = req.params.username
    const payload = req.body
    if (!req.jwt) return res.sendStatus(401)
    const { rank, username } = req.jwt
    //* Must be admin rank to modify other users data, or modify own
    const notAdminRank = !rank || rank < adminRank
    if (notAdminRank && userToModify !== username) return res.sendStatus(403)
    if (payload.password || payload.username || payload.createdAt || payload['_id']) 
      return res.status(400).send("Field cannot be modified")

    if (userToModify === username && payload.rank > rank)
      return res.status(403).send("You cannot increase your own rank")

    const userToModifyData = await prisma.user.findFirst({ where: { username: userToModify } })
    if (!userToModifyData) return res.status(404).send('User not found')

    if (rank <= userToModifyData.rank && userToModify !== username) return res.status(403).send('User has equal or higher rank')
    if (payload.permissions && userToModify === username && notAdminRank) return res.status(403).send('You cannot modify your own permissions')

    try {
      //* Invalidate previous tokens
      payload.jti = uuidv4()
      if (payload.permissions) {
        payload.permissions = JSON.stringify(payload.permissions)
      }
      
      await prisma.user.update({
        where: { username: userToModify },
        data: payload
      })

      if (userToModify === username) {
        const result = await prisma.user.findFirst({ where: { username: userToModify } })
        if (result) {
          const token = jwt.sign({ 
            username,
            rank: result.rank,
            permissions: JSON.parse(result.permissions),
            jti: result.jti
          }, jwtSecret)
          res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })
        }
      }

      return res.sendStatus(200)
    } catch (err) {
      console.error(err)
      return res.status(500).send(err)
    }
  }
)

//FIXME: This could be more secure, disable same site for now because of different domains
router.post('/get', async (req, res) => {
  const { username } = req.body
  if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
  const token = jwt.sign({
    "api-login": true,
    username,
    rank: 9999
  }, jwtSecret)
  log(`API key login request received from ${req.clientIp}`)
  res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })
  return res.status(200).send("OK")
})

router.get('/verify/:token', async (req, res) => {
  log(`Verification request received from ${req.clientIp}`)
  try {
    const { token } = req.params
    const decoded = jwt.verify(token, jwtSecret)
    console.log(decoded)
    return res.status(200).send("OK")
  } catch (error) {
    console.error(error)
    return res.status(401).send('Invalid JWT')
  }
})

router.get('/logout', (req, res) => {
  log(`Logout request from ${req.clientIp}`)
  res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
  return res.status(200).send("OK")
})

export default router

function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key]
  }
  return user
}

function parsePermissions (user: Omit<User, "password"> | Omit<User, "password">[]) {
  if (user instanceof Array) {
    user.forEach((_, index) => user[index].permissions = JSON.parse(user[index].permissions))
  } else {
    user.permissions = JSON.parse(user.permissions)
  }
  return user
}