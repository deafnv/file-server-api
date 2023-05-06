import path from 'path'

import express from 'express'
import { body } from 'express-validator'
import fse from 'fs-extra'

import { excludedDirs, rootDirectoryPath } from '../../lib/config.js'
import validateErrors from '../../lib/validate.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'

const router = express.Router()

router.post(
  '/', 
  authorize, 
  body('pathToFiles').isArray({ min: 1 }), 
  body('pathToFiles.*').isString(),
  body('newPath').isString(),
  validateErrors,
  async (req, res) => {
  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

  const { pathToFiles, newPath } = req.body
  
  let failedFiles = []

  for (const file of pathToFiles) {
    const fileName = path.parse(file).base
    const newFilePath = path.join(rootDirectoryPath, newPath, fileName)

    try {
      await fse.copy(path.join(rootDirectoryPath, file), newFilePath)
      log(`Copy request "${file}", to "${newPath}" for "${req.clientIp}"`)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  //* Emit change for both outgoing and incoming directories
  emitFileChange(path.dirname(pathToFiles[0]), 'COPY')
  emitFileChange(newPath, 'COPY')

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send("OK")
})

export default router