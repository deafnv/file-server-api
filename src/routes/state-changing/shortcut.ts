import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'
import omit from 'lodash/omit.js'

import { excludedDirs, metadataEnabled, rootDirectoryPath } from '../../lib/config.js'
import validateErrors from '../../lib/validate.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import emitFileChange from '../../lib/live.js'
import log from '../../lib/log.js'

const router = express.Router()

router.post(
  '/', 
  authorize,
  body('target').isString(),
  body('currentPath').isString(), 
  validateErrors,
  async (req, res) => {
    const { target, currentPath } = req.body
    const targetPathFull = path.join(rootDirectoryPath, target)
    const currentPathFull = path.join(rootDirectoryPath, currentPath)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
    if (!(await fs.exists(targetPathFull))) return res.sendStatus(404)

    //* No shortcuts for shortcut files
    if (path.basename(target).includes('.shortcut.json')) return res.sendStatus(400)

    try {
      const targetStat = await fs.stat(targetPathFull)
      const targetMetadata = targetStat.isDirectory() && metadataEnabled && await fs.exists(path.join(targetPathFull, '.metadata.json')) ? JSON.parse(await fs.readFile(path.join(targetPathFull, '.metadata.json'), 'utf-8')) : {}
      
      const shortcutFile = {
        shortcutName: path.basename(target),
        target,
        targetData: {
          name: path.basename(target),
          size: targetStat.size,
          created: targetStat.birthtime,
          modified: targetStat.mtime,
          isDirectory: targetStat.isDirectory(),
          metadata: Object.keys(targetMetadata).length ? omit(targetMetadata, ['name', 'path']) : undefined
        }
      }

      await fs.writeFile(path.join(currentPathFull, `${path.parse(target).name}-${new Date().getTime()}.shortcut.json`), JSON.stringify(shortcutFile, null, 2), 'utf8')

      log(`Shortcut for "${target}" created in "${currentPath}" by ${req.clientIp}`)
      emitFileChange(currentPath, 'SHORTCUT')

      return res.sendStatus(200)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  }
)

export default router