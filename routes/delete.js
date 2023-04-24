import express from 'express'
import fs from 'fs'
import path from 'path'
import { body } from 'express-validator'

import { rootDirectoryPath } from '../index.js'
import validateErrors from '../lib/validate.js'
import authorize from '../lib/authorize-func.js'
import emitFileChange from '../lib/live.js'
import log from '../lib/log.js'

const router = express.Router()

router.delete(
  '/', 
  authorize, 
  body('pathToFiles').isArray({ min: 1 }), 
  body('pathToFiles.*').isString(),
  validateErrors,
  async (req, res) => {
  const { pathToFiles } = req.body

  let failedFiles = []

  for (const file of pathToFiles) {
    const fullFilePath = path.join(rootDirectoryPath, file)

    if (!fs.existsSync(fullFilePath)) {
      failedFiles.push(file)
      continue
    }

    try {
      await fs.promises.rm(fullFilePath, { recursive: true, force: true,  maxRetries: 3 })
      log(`File delete request "${fullFilePath}" for "${req.clientIp}"`)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  emitFileChange(path.dirname(pathToFiles[0]), 'DELETE')

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send('OK')
})

export default router