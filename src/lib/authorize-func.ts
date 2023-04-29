import { RequestHandler } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

import { adminRank, db, dbEnabled, fsApiKeys, jwtSecret } from '../index.js'

declare module 'express-serve-static-core' {
  interface Request {
    jwt?: JwtPayload
  }
}

const authorize: RequestHandler = async (req, res, next) => {
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
    req.jwt = decoded as JwtPayload
    return next()
  }
  
  try {
    const { originalUrl } = req
    const targetPath = originalUrl.split('/')[1]
    const decoded = jwt.verify(token, jwtSecret)
    req.jwt = decoded as JwtPayload

    //* If db not enabled, and logged in
    if (decoded && !dbEnabled) return next()

    //* if logged in and accessing non-state changing routes
    if (['list', 'filetree', 'retrieve'].includes(targetPath)) return next()

    //* Check if permissions allow
    const collection = db.collection('users')
    const userData = await collection.findOne({ username: (decoded as JwtPayload).username })

    //* Token invalidated
    if (!userData || (decoded as JwtPayload).jti != userData.jti && !(decoded as JwtPayload)["api-login"]) {
      res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
      return res.sendStatus(401)
    }
    
    //* JWT has permissions or is admin rank
    if ((decoded as JwtPayload).permissions[targetPath] || (decoded as JwtPayload).rank >= adminRank) {
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