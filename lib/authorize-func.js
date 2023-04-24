import jwt from 'jsonwebtoken'

import { fsApiKeys, jwtSecret } from '../index.js'

const authorize = (req, res, next) => {
  const { token } = req.cookies
  if (req.headers["x-api-key"] == undefined && !token) return res.status(401).send('This route requires an API key header: X-API-Key, or a token cookie')

  if (req.headers["x-api-key"]) {
    if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
    return next()
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret)
    return next()
  } catch (error) {
    console.log(error)
    return res.status(401).send('Invalid token provided')
  }
}

export default authorize