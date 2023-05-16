import fs from 'fs'
import path from 'path'

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
  body('newDirName').isString(), 
  body('currentPath').isString(),
  validateErrors,
  (req, res) => {
  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
  const { newDirName, currentPath } = req.body

  let queryPath = path.join(rootDirectoryPath, currentPath, newDirName)

  fs.mkdir(queryPath, (err) => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }
    log(`Create new directory request in "${currentPath}, name "${newDirName}" for "${req.clientIp}"`)
    emitFileChange(currentPath, 'NEWDIR')
    return res.status(201).send('OK')
  })
})

export default router