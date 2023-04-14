import fs from 'fs'
import path from 'path'
import express from 'express'
import multer from 'multer'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'
import emitFileChange from '../lib/live.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const filePath = req.params.filepath
    const inputDirectory = path.join(process.env.ROOT_DIRECTORY_PATH, filePath)
    if (!fs.existsSync(inputDirectory))
      await fs.promises.mkdir(inputDirectory)
    cb(null, inputDirectory)
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
  
router.post('/:filepath(*)', authorize, upload.array('upload-file'), async (req, res) => {
  const filePath = req.params.filepath
  log(`Upload request authorized for "${req.clientIp}"`)
  emitFileChange(filePath, 'UPLOAD')

  return res.status(200).send('OK')
})

export default router