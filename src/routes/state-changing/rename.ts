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

router.patch(
  '/',
  authorize,
  body('pathToFile').isString(),
  body('newName').isString(),
  validateErrors,
  async (req, res) => {
    const { pathToFile, newName } = req.body

    //* Path traversal
    if (pathToFile.match(/\.\.[\/\\]/g) || newName.match(/\.\.[\/\\]/g)) return res.sendStatus(400)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    if (!(await fs.exists(path.join(rootDirectoryPath, pathToFile))))
      return res.status(404).send('Path does not exist')

    const pathWithoutFile = path.dirname(pathToFile)
    const newFilePath = path.join(rootDirectoryPath, pathWithoutFile, newName)

    try {
      if (path.basename(pathToFile).includes('.shortcut.json')) {
        let oldShortcutData = JSON.parse(
          await fs.readFile(path.join(rootDirectoryPath, pathToFile), 'utf8')
        )
        oldShortcutData.shortcutName = newName

        await fs.writeFile(
          path.join(rootDirectoryPath, pathToFile),
          JSON.stringify(oldShortcutData, null, 2),
          'utf8'
        )

        log({
          req,
          eventType: 'RENAME',
          eventPath: pathToFile,
          eventOld: pathToFile,
          eventNew: pathToFile,
          eventData: 'Renaming shortcut',
        })
        emitFileChange(path.dirname(pathToFile), 'RENAME')
        return res.sendStatus(200)
      }

      await fs.rename(path.join(rootDirectoryPath, pathToFile), newFilePath)

      //? Currently passing in new name for fs.stat in log function
      log({
        req,
        eventType: 'RENAME',
        eventPath: path.join(path.dirname(pathToFile), newName).replaceAll(path.sep, '/'),
        eventOld: pathToFile,
        eventNew: path.join(path.dirname(pathToFile), newName).replaceAll(path.sep, '/'),
      })
      emitFileChange(path.dirname(pathToFile), 'RENAME')
    } catch (error) {
      console.error(error)
      return res.status(500).send('Something went wrong')
    }

    return res.sendStatus(200)
  }
)

export default router
