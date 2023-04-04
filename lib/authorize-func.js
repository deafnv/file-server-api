import jwt from 'jsonwebtoken'

const authorize = (req, res, next) => {
  const { token } = req.cookies
  if (req.headers["x-api-key"] == undefined && !token) return res.status(401).send('This route requires an API key header: X-API-Key, or a token cookie')

  if (req.headers["x-api-key"]) {
    if (req.headers["x-api-key"] != process.env.API_KEY) return res.status(401).send('Wrong API key')
    return next()
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch (error) {
    console.log(error)
    return res.status(401).send('Invalid token provided')
  }
}

export default authorize