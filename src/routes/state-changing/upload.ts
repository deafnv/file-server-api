import fs from 'fs'
import path from 'path'

import express, { RequestHandler } from 'express'
import multer from 'multer'

import { excludedDirs, rootDirectoryPath } from '../../index.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const filePath = req.params.filepath
    const inputDirectory = path.join(rootDirectoryPath, filePath)
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

const excludedDirectories: RequestHandler = (req, res, next) => {
  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
  return next()
}
  
router.post('/:filepath(*)', excludedDirectories, authorize, upload.array('upload-file'), async (req, res) => {
  const filePath = req.params.filepath
  log(`Upload request authorized for "${req.clientIp}"`)
  emitFileChange(filePath, 'UPLOAD')

  return res.status(200).send('OK')
})

export default router