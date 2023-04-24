import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body } from 'express-validator'
import escapeStringRegexp from 'escape-string-regexp'

import { fsApiKeys, jwtSecret, db, dbEnabled, restrictedUsernames, adminRank } from '../index.js'
import authorize from '../lib/authorize-func.js'
import validateErrors from '../lib/validate.js'
import log from '../lib/log.js'

const router = express.Router()

const matchPassword = async (username, password) => {
  const collection = db.collection('users')
  const existingMatch = await collection.findOne({ username: username.trim() })
  if (!existingMatch) return false

  const bcryptMatch = await bcrypt.compare(password, existingMatch.password)
  if (!bcryptMatch) return false

  return existingMatch
}

//* User account management
router.post(
  '/register', 
  body('username', 'Username must be between 4-10 characters long').isString().isLength({ min: 4, max: 16 }),
  body('password', 'Password must be between 6-24 characters long').isString().isLength({ min: 6, max: 24 }),
  validateErrors,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const { username, password } = req.body
    if (restrictedUsernames.includes(username.trim().toLowerCase())) 
      return res.status(400).send('That username is restricted')

    try {
      const collection = db.collection('users')
      const existingMatch = await collection.findOne({ username })
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
      const response = await collection.insertOne({
        username: username.trim(),
        password: hashedPassword,
        rank: 0,
        permissions: defaultPerms,
        createdAt: Date.now()
      })

      const token = jwt.sign({ 
        username,
        rank: 0,
        permissions: defaultPerms
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
      if (!bcryptMatch) return res.status(400).send('Wrong username or password')

      const token = jwt.sign({ 
        username,
        rank: bcryptMatch.rank,
        permissions: bcryptMatch.permissions,
      }, jwtSecret)
      res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })

      log(`Login request received from ${req.clientIp}`)
      return res.sendStatus(200)
    } catch (error) {
      console.error(err)
      return res.status(500).send(err)
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
      const collection = db.collection('users')
      const bcryptMatch = await matchPassword(username, password)
      if (!bcryptMatch) return res.status(400).send('Wrong username or password')

      res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })

      await collection.deleteOne({ username: username.trim() })

      log(`Delete account request received from ${req.clientIp}`)
      return res.sendStatus(200)
    } catch (error) {
      console.error(err)
      return res.status(500).send(err)
    }
  }
)

//* Admin controls
router.get(
  '/user',
  authorize,
  async (req, res) => {
    if (!dbEnabled) return res.sendStatus(404)
    const { user } = req.query
    const { rank } = req.jwt
    //* Must be admin rank to query other users
    if (!rank || rank < adminRank) return res.sendStatus(401)

    const collection = db.collection('users')
    const options = {
      projection: { _id: 0, password: 0 },
    }

    try {
      if (!user) {
        const queryAll = await collection.find({}, options).toArray()
        return res.status(200).send(queryAll)
      }
      
      const regexString = escapeStringRegexp(user)
      const regex = new RegExp(regexString, "i")
      const queryString = await collection.find({ username: { $regex: regex } }, options).toArray()
      return res.status(200).send(queryString)
    } catch (err) {
      console.error(err)
      return res.status(401).send(err)
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
    const { rank, username } = req.jwt
    //* Must be admin rank to modify other users data, or modify own
    const notAdminRank = !rank || rank < adminRank
    if (notAdminRank && userToModify !== username) return res.sendStatus(401)
    if (payload.password || payload.username || payload.createdAt || payload['_id']) 
      return res.status(400).send("Field cannot be modified")

    if (userToModify === username && payload.rank > rank)
      return res.status(401).send("You cannot increase your own rank")

    const collection = db.collection('users')
    const userToModifyData = await collection.findOne({ username: userToModify })
    if (!userToModifyData) return res.status(404).send('User not found')

    if (rank <= userToModifyData.rank && userToModify !== username) return res.status(401).send('User has equal or higher rank')
    if (payload.permissions && userToModify === username && notAdminRank) return res.status(401).send('You cannot modify your own permissions')

    try {
      await collection.updateOne({ username: userToModify }, { $set: payload }, { returnDocument: "after" })

      if (userToModify === username) {
        const result = await collection.findOne({ username: userToModify })
        const token = jwt.sign({ 
          username,
          rank: result.rank,
          permissions: result.permissions,
        }, jwtSecret)
        res.cookie('token', token, { path: '/', httpOnly: true, sameSite: 'none', secure: true })
      }

      return res.sendStatus(200)
    } catch (err) {
      console.log(err)
      return res.status(500).send(err)
    }
  }
)

//FIXME: This could be more secure, disable same site for now because of different domains
router.post('/get', async (req, res) => {
  const { username } = req.body
  log(`API key login request received from ${req.clientIp}`)
  if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
  const token = jwt.sign({ 
    username,
    rank: 9999,
    permissions: {
      "admin": true,
      "makedir": true,
      "upload": true,
      "rename": true,
      "copy": true,
      "move": true,
      "delete": true,
    }
  }, jwtSecret)
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
    console.log(error)
    return res.status(401).send('Invalid JWT')
  }
})

router.get('/delete', (req, res) => {
  log(`Logout request from ${req.clientIp}`)
  res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
  return res.status(200).send("OK")
})

export default router