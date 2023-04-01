import fs from 'fs'
import path from 'path'
import express from 'express'
import multer from 'multer'
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

router.post('/:filepath(*)', upload.array('upload-file'), async (req, res) => {
  const filePath = req.params.filepath
  if (req.headers["x-api-key"] == undefined) return res.status(401).send('This route requires an API key header: X-API-Key')
  if (req.headers["x-api-key"] !== process.env.API_KEY) return res.status(401).send('Wrong API key')
  log(`Upload request authorized for "${req.clientIp}"`)
  
  const inputDirectory = path.join(process.env.ROOT_DIRECTORY_PATH, filePath)
  
  await fs.promises.cp('uploads', inputDirectory, { recursive: true })
  fs.rmSync('uploads', { recursive: true, force: true })

  return res.status(200).send('OK')
})

export default router