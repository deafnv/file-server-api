import express from 'express'
import jwt from 'jsonwebtoken'

import { fsApiKeys, jwtSecret } from '../index.js'
import log from '../lib/log.js'

const router = express.Router()

//FIXME: This could be more secure, disable same site for now because of different domains
router.post('/get', async (req, res) => {
  log(`Login request received from ${req.clientIp}`)
  if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
  const token = jwt.sign(req.body, jwtSecret)
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