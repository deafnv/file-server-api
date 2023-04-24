import jwt from 'jsonwebtoken'

import { fsApiKeys, jwtSecret } from '../index.js'

const authorize = (req, res, next) => {
  const { token } = req.cookies
  if (req.headers["x-api-key"] == undefined && !token) return res.status(401).send('This route requires an API key header: X-API-Key, or a token cookie')

  if (req.headers["x-api-key"]) {
    if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
    //* Pass along admin jwt for api key
    const adminJwt = jwt.sign({ 
      username: 'admin',
      rank: 99999,
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
    const decoded = jwt.verify(adminJwt, jwtSecret)
    req.jwt = decoded
    return next()
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.jwt = decoded
    return next()
  } catch (error) {
    console.log(error)
    return res.status(401).send('Invalid token provided')
  }
}

export default authorize