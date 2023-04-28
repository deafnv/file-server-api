import jwt from 'jsonwebtoken'

import { adminRank, db, dbEnabled, fsApiKeys, jwtSecret } from '../index.js'

const authorize = async (req, res, next) => {
  const { token } = req.cookies
  if (req.headers["x-api-key"] == undefined && !token) return res.status(401).send('This route requires an API key header: X-API-Key, or a token cookie')

  if (req.headers["x-api-key"]) {
    if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
    //* Pass along admin jwt for api key
    const adminJwt = jwt.sign({
      username: 'admin',
      rank: 99999
    }, jwtSecret)
    const decoded = jwt.verify(adminJwt, jwtSecret)
    req.jwt = decoded
    return next()
  }
  
  try {
    const { originalUrl } = req
    const targetPath = originalUrl.split('/')[1]
    const decoded = jwt.verify(token, jwtSecret)
    req.jwt = decoded

    //* If db not enabled, and logged in
    if (decoded && !dbEnabled) return next()

    //* if logged in and accessing non-state changing routes
    if (['list', 'filetree', 'retrieve'].includes(targetPath)) return next()

    //* Check if permissions allow
    const collection = db.collection('users')
    const userData = await collection.findOne({ username: decoded.username })

    //* Token invalidated
    if (decoded.jti != userData.jti && !decoded["api-login"]) {
      res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
      return res.sendStatus(401)
    }
    
    //* JWT has permissions or is admin rank
    if (decoded.permissions[targetPath] || decoded.rank >= adminRank) {
      return next()
    } else {
      return res.sendStatus(403)
    }
  } catch (error) {
    console.log(error)
    res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
    return res.status(401).send('Invalid token provided')
  }
}

export default authorize