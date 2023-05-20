import fs from 'fs'
import path from 'path'

import express from 'express'
import { body } from 'express-validator'
import uniq from 'lodash/uniq.js'

import validateErrors from '../../lib/validate.js'
import { excludedDirs, rootDirectoryPath } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { isValidMetadata } from '../../lib/metadata-init.js'
import emitFileChange from '../../lib/live.js'

const router = express.Router()

router.post(
  '/', 
  body('directories').isArray({ min: 1 }), 
  body('directories.*').isString(),
  validateErrors,
  authorize, 
  async (req, res) => {
    const { directories, newMetadata }: { directories: string[], newMetadata: any } = req.body

    if (!isValidMetadata(newMetadata, false)) return res.status(400).send('Invalid metadata')
    if (!directories.every(async directory => (await fs.promises.stat(path.join(rootDirectoryPath, directory))).isDirectory())) return res.status(400).send('Not a directory')

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

    try {
      for (const directory of directories) {
        const metadataFilePath = path.join(rootDirectoryPath, directory, '.metadata.json')

        const oldMetadata = JSON.parse(await fs.promises.readFile(metadataFilePath, 'utf8'))

        let combined = oldMetadata
        Object.keys(newMetadata).forEach(key => {
          //* Don't change these
          if (['name', 'path'].includes(key)) return
          combined[key] = newMetadata[key]
        })

        await fs.promises.writeFile(metadataFilePath, JSON.stringify(combined, null, 2), 'utf8')
      }

      const parentDirs = uniq(directories.map(directory => directory.split('/').slice(0, -1).join('/')))
      parentDirs.forEach(parentDir => {
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