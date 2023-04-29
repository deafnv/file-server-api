import fs from 'fs'
import path from 'path'

import express from 'express'
import { body } from 'express-validator'

import { rootDirectoryPath } from '../../index.js'
import validateErrors from '../../lib/validate.js'
import authorize from '../../lib/authorize-func.js'
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
  const { pathToFiles, newPath } = req.body
  
  let failedFiles = []

  for (const file of pathToFiles) {
    const fileName = path.parse(file).base
    const newFilePath = path.join(rootDirectoryPath, newPath, fileName)

    try {
      await fs.promises.rename(path.join(rootDirectoryPath, file), newFilePath)
      log(`File move request "${file}", to "${newPath}" for "${req.clientIp}"`)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  //* Emit change for both outgoing and incoming directories
  emitFileChange(path.dirname(pathToFiles[0]), 'MOVE')
  emitFileChange(newPath, 'MOVE')

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send("OK")
})

export default router