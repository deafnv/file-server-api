import fs from 'fs'
import path from 'path'

import express, { RequestHandler } from 'express'
import multer from 'multer'

import { excludedDirs, rootDirectoryPath } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'
import { makeDirectory } from './makedir.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const filePath = req.params.filepath
      .split('/')
      .map((p) => decodeURIComponent(p))
      .join('/')
    const inputDirectory = path.join(rootDirectoryPath, filePath)
    if (!fs.existsSync(inputDirectory)) {
      await makeDirectory({
        newDirPath: inputDirectory,
      })
    }
    cb(null, inputDirectory)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const upload = multer({
  dest: 'uploads/',
  storage,
})

const excludedDirectories: RequestHandler = (req, res, next) => {
  const filePath = req.params.filepath
  //* Path traversal
  if (filePath.match(/\.\.[\/\\]/g)) return res.sendStatus(400)

  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
  return next()
}

router.post(
  '/:filepath(*)',
  excludedDirectories,
  authorize,
  upload.single('upload-file'),
  async (req, res) => {
    const filePath = req.params.filepath
    log({
      req,
      eventType: 'UPLOAD',
      eventPath: path.join(req.params.filepath, req.file.originalname).replaceAll(path.sep, '/'),
    })
    emitFileChange(filePath, 'UPLOAD')

    return res.status(200).send('OK')
  }
)

export default router
