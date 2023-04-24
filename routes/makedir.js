import express from 'express'
import fs from 'fs'
import path from 'path'
import { body } from 'express-validator'

import { rootDirectoryPath } from '../index.js'
import validateErrors from '../lib/validate.js'
import authorize from '../lib/authorize-func.js'
import emitFileChange from '../lib/live.js'
import log from '../lib/log.js'

const router = express.Router()

router.post(
  '/',
  authorize,
  body('newDirName').isString(), 
  body('currentPath').isString(),
  validateErrors,
  (req, res) => {
  const { newDirName, currentPath } = req.body

  let queryPath = path.join(rootDirectoryPath, currentPath, newDirName)

  fs.mkdir(queryPath, (err) => {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }
    log(`Directory create request "${currentPath}", name "${newDirName}" for "${req.clientIp}"`)
    emitFileChange(currentPath, 'NEWDIR')
    return res.status(201).send('OK')
  })
})

export default router