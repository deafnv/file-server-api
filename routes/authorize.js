import fs from 'fs'
import path from 'path'
import express from 'express'
import jwt from 'jsonwebtoken'

const router = express.Router()

router.post('/get', async (req, res) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) return res.status(401).send('Wrong API key')
  const token = jwt.sign(req.body, process.env.JWT_SECRET)
  return res.status(200).send(token)
})

router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decoded)
    return res.status(200).send("OK")
  } catch (error) {
    console.log(error)
    return res.status(401).send('Invalid JWT')
  }
})

export default router