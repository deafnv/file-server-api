import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'

import { excludedDirs, metadataEnabled, rootDirectoryPath } from '../../lib/config.js'
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
    const { pathToFiles, newPath } = req.body

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
        const isFileDirectory = (await fs.stat(path.join(rootDirectoryPath, file))).isDirectory()
        const metadataPath = path.join(rootDirectoryPath, file, '.metadata.json')
        const metadataExists = await fs.exists(metadataPath)
        let oldMetadata =
          metadataEnabled && metadataExists && isFileDirectory
            ? JSON.parse(await fs.readFile(metadataPath, 'utf8'))
            : undefined
        await fs.copy(path.join(rootDirectoryPath, file), newFilePath)

        if (metadataEnabled && metadataExists && isFileDirectory) {
          const newMetadata = {
            name: fileName,
            path:
              newFilePath.replace(rootDirectoryPath, '').charAt(0) == path.sep
                ? `${newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/')}`
                : `/${newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/')}`,
          }

          let combined = oldMetadata
          Object.keys(newMetadata).forEach((key) => {
            combined[key] = newMetadata[key]
          })

          await fs.writeFile(
            path.join(newFilePath, '.metadata.json'),
            JSON.stringify(combined, null, 2),
            'utf8'
          )
        }

        log(`Copy request "${file}", to "${newPath}" for "${req.clientIp}"`)
      } catch (error) {
        failedFiles.push(file)
        console.error(error)
      }
    }

    //* Emit change for both outgoing and incoming directories
    emitFileChange(path.dirname(pathToFiles[0]), 'COPY')
    emitFileChange(newPath, 'COPY')

    if (failedFiles.length)
      return res.status(200).send({
        message: 'Some files failed',
        failedFiles,
      })

    return res.status(200).send('OK')
  }
)

export default router
