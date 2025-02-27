import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'

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
    const pathToFiles = req.body.pathToFiles.map((pathToFile) =>
      pathToFile
        .split('/')
        .map((p) => decodeURIComponent(p))
        .join('/')
    )
    const newPath = req.body.newPath
      .split('/')
      .map((p) => decodeURIComponent(p))
      .join('/')

    //* Path traversal
    if (
      (pathToFiles as string[]).some((pathToFile) => pathToFile.match(/\.\.[\/\\]/g)) ||
      newPath.match(/\.\.[\/\\]/g)
    )
      return res.sendStatus(400)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    let failedFiles = []

    for (const file of pathToFiles) {
      const fileName = path.parse(file).base
      const newFilePath = path.join(rootDirectoryPath, newPath, fileName)

      try {
        await fs.rename(path.join(rootDirectoryPath, file), newFilePath)

        log(
          {
            req,
            eventType: 'MOVE',
            eventPath: newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
            eventOld: file,
            eventNew: newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
          },
          file
        )
      } catch (error) {
        failedFiles.push(file)
        console.error(error)
      }
    }

    //* Emit change for both outgoing and incoming directories
    emitFileChange(path.dirname(pathToFiles[0]), 'MOVE')
    emitFileChange(newPath, 'MOVE')

    if (failedFiles.length)
      return res.status(200).send({
        message: 'Some files failed',
        failedFiles,
      })

    return res.status(200).send('OK')
  }
)

export default router
