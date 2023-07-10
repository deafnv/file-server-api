import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'
import uniq from 'lodash/uniq.js'

import validateErrors from '../../lib/validate.js'
import { excludedDirs, rootDirectoryPath } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { isValidMetadata } from '../../lib/metadata-init.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'

const router = express.Router()

router.post(
  '/',
  body('directories').isArray({ min: 1 }),
  body('directories.*').isString(),
  validateErrors,
  authorize,
  async (req, res) => {
    const { directories, newMetadata }: { directories: string[]; newMetadata: any } = req.body

    //* Path traversal
    if ((directories as string[]).some((directory) => directory.match(/\.\.[\/\\]/g)))
      return res.sendStatus(400)

    if (!isValidMetadata(newMetadata, false)) return res.status(400).send('Invalid metadata')
    if (
      !directories.every(async (directory) =>
        (await fs.stat(path.join(rootDirectoryPath, directory))).isDirectory()
      )
    )
      return res.status(400).send('Not a directory')

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    try {
      for (const directory of directories) {
        const isShortcut = path.basename(directory).includes('.shortcut.json')
        const metadataFilePath = isShortcut
          ? path.join(rootDirectoryPath, directory)
          : path.join(rootDirectoryPath, directory, '.metadata.json')

        const oldMetadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf8'))

        let combinedMetadata = isShortcut ? oldMetadata.targetData.metadata : oldMetadata
        Object.keys(newMetadata).forEach((key) => {
          //* Don't change these
          if (['name', 'path'].includes(key)) return
          combinedMetadata[key] = newMetadata[key]
        })

        if (isShortcut) {
          let tempMetadata = oldMetadata
          tempMetadata.targetData.metadata = combinedMetadata
          combinedMetadata = tempMetadata
        }

        await fs.writeFile(metadataFilePath, JSON.stringify(combinedMetadata, null, 2), 'utf8')
      }

      //* Log metadata changes
      directories.forEach((directory) =>
        log({
          req,
          eventType: 'METADATA',
          eventPath: directory,
          eventData: JSON.stringify(newMetadata),
        })
      )

      //* Notify client side about each metadata changes in parent directory
      const parentDirs = uniq(
        directories.map((directory) => directory.split('/').slice(0, -1).join('/'))
      )
      parentDirs.forEach((parentDir) => {
        emitFileChange(parentDir.charAt(0) == '/' ? parentDir : `/${parentDir}`, 'METADATA')
      })

      return res.sendStatus(200)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  }
)

export default router
