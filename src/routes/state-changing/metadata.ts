import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'
import uniq from 'lodash/uniq.js'

import { prisma } from '../../index.js'
import validateErrors from '../../lib/validate.js'
import { excludedDirs, rootDirectoryPath } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'
import { FileMetadata } from '../../lib/types.js'

const router = express.Router()

function isValidMetadata(obj: any): obj is FileMetadata {
  if (typeof obj != 'object') return false
  if (obj.description !== undefined && typeof obj.description !== 'string') return false
  if (obj.color !== undefined && typeof obj.color !== 'string') return false
  return true
}

router.post(
  '/',
  body('pathToFiles').isArray({ min: 1 }),
  body('pathToFiles.*').isString(),
  validateErrors,
  authorize,
  async (req, res) => {
    const { pathToFiles, newMetadata }: { pathToFiles: string[]; newMetadata: any } = req.body
    if (!isValidMetadata(newMetadata)) return res.status(400).send('Invalid metadata')

    //* Path traversal
    if (pathToFiles.some((directory) => directory.match(/\.\.[\/\\]/g))) return res.sendStatus(400)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    try {
      for (const file of pathToFiles) {
        const isShortcut = path.basename(file).includes('.shortcut.json')
        const shortcutData = isShortcut
          ? JSON.parse(await fs.readFile(path.join(rootDirectoryPath, file), 'utf8'))
          : undefined

        let fileID: string
        if (isShortcut) {
          fileID = (await fs.stat(path.join(rootDirectoryPath, shortcutData.target))).ino.toString()
        } else {
          fileID = (await fs.stat(path.join(rootDirectoryPath, file)))?.ino?.toString()
        }

        if (!fileID) {
          console.error('Something went wrong with function call `stat` with "' + file + '"')
        }

        const currentMetadata = await prisma.metadata.findFirst({
          where: {
            file_id: fileID,
          },
        })

        //* Default metadata here
        const defaultMetadata = { description: '', color: '' }

        let metadataToUpsert: FileMetadata =
          currentMetadata && currentMetadata.metadata
            ? JSON.parse(currentMetadata.metadata)
            : defaultMetadata

        Object.keys(defaultMetadata).forEach((key) => (metadataToUpsert[key] = newMetadata[key]))

        /* if (isShortcut) {
          let tempMetadata = oldMetadata
          tempMetadata.targetData.metadata = combinedMetadata
          combinedMetadata = tempMetadata
        } */

        await prisma.metadata.upsert({
          where: {
            file_id: fileID,
          },
          create: {
            file_id: fileID,
            metadata: JSON.stringify(metadataToUpsert),
          },
          update: {
            metadata: JSON.stringify(metadataToUpsert),
          },
        })

        log({
          req,
          eventType: 'METADATA',
          eventPath: isShortcut ? shortcutData.target : file,
          eventData: JSON.stringify(metadataToUpsert),
        })
      }

      //* Notify client side about each metadata changes in parent directory
      const parentDirs = uniq(pathToFiles.map((file) => file.split('/').slice(0, -1).join('/')))
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
