import fs from 'fs'
import path from 'path'
import express from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import log from '../lib/log.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    if (!fs.existsSync('uploads'))
      await fs.promises.mkdir('uploads')
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    log(`Upload request for file "${file.originalname}" received from "${req.clientIp}"`)
    cb(null, file.originalname)
  }
})
const upload = multer({
  dest: 'uploads/',
  storage
})

const authorize = (req, res, next) => {
  const { token } = req.cookies
  console.log(token)
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
  
router.post('/:filepath(*)', authorize, upload.array('upload-file'), async (req, res) => {
  const filePath = req.params.filepath
  log(`Upload request authorized for "${req.clientIp}"`)
  
  const inputDirectory = path.join(process.env.ROOT_DIRECTORY_PATH, filePath)
  
  await fs.promises.cp('uploads', inputDirectory, { recursive: true })
  fs.rmSync('uploads', { recursive: true, force: true })

  return res.status(200).send('OK')
})

export default router