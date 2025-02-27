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
  body('target').isString(),
  body('currentPath').isString(),
  validateErrors,
  async (req, res) => {
    const target = req.body.target
      .split('/')
      .map((p) => decodeURIComponent(p))
      .join('/')
    const currentPath = req.body.currentPath
      .split('/')
      .map((p) => decodeURIComponent(p))
      .join('/')

    const targetPathFull = path.join(rootDirectoryPath, target)
    const currentPathFull = path.join(rootDirectoryPath, currentPath)

    //* Path traversal
    if (target.match(/\.\.[\/\\]/g) || currentPath.match(/\.\.[\/\\]/g)) return res.sendStatus(400)

    //* Excluded directory
    if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
    if (!(await fs.exists(targetPathFull))) return res.sendStatus(404)

    //* No shortcuts for shortcut files
    if (path.basename(target).includes('.shortcut.json')) return res.sendStatus(400)

    try {
      const targetStat = await fs.stat(targetPathFull)

      const shortcutFile = {
        shortcutName: path.basename(target),
        target,
        targetData: {
          name: path.basename(target),
          size: targetStat.size,
          created: targetStat.birthtime,
          modified: targetStat.mtime,
          isDirectory: targetStat.isDirectory(),
        },
      }

      await fs.writeFile(
        path.join(
          currentPathFull,
          `${path.parse(target).name}-${new Date().getTime()}.shortcut.json`
        ),
        JSON.stringify(shortcutFile, null, 2),
        'utf8'
      )

      log({
        req,
        eventType: 'SHORTCUT',
        eventPath: target,
        eventOld: target,
        eventNew: currentPath,
      })
      emitFileChange(currentPath, 'SHORTCUT')

      return res.sendStatus(200)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  }
)

export default router
