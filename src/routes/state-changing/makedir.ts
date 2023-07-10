import fs from 'fs'
import path from 'path'

import express, { Response } from 'express'
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
  body('newDirName').isString(),
  body('currentPath').isString(),
  validateErrors,
  async (req, res) => {
    const { newDirName, currentPath } = req.body

    //* Path traversal
    if (currentPath.match(/\.\.[\/\\]/g) || newDirName.match(/\.\.[\/\\]/g))
      return res.sendStatus(400)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    let queryPath = path.join(rootDirectoryPath, currentPath, newDirName)

    await makeDirectory({
      newDirPath: queryPath,
      res,
    })

    log({
      req,
      eventType: 'MAKEDIR',
      eventPath: path.join(currentPath, newDirName).replaceAll(path.sep, '/'),
      eventNew: path.join(currentPath, newDirName).replaceAll(path.sep, '/'),
      eventData: newDirName,
    })
    return res.status(201).send('OK')
  }
)

export default router

//* Utility function for making new directory, also used in /upload
export async function makeDirectory({
  newDirPath, //? Full path, with root
  res,
}: {
  newDirPath: string
  res?: Response
}) {
  const pathWithoutRoot = newDirPath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/')

  try {
    await fs.promises.mkdir(newDirPath)

    if (metadataEnabled) {
      const defaultMetadata = {
        name: path.basename(newDirPath),
        path: pathWithoutRoot,
        color: '',
      }

      await fs.promises.writeFile(
        path.join(newDirPath, '.metadata.json'),
        JSON.stringify(defaultMetadata, null, 2),
        'utf8'
      )
    }

    emitFileChange(path.dirname(pathWithoutRoot), 'NEWDIR')
  } catch (error) {
    console.error(error)
    if (res) res.status(500).send(error)
    return
  }
}
