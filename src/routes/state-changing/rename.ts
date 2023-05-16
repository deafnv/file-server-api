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

router.patch(
  '/', 
  authorize,
  body('pathToFile').isString(),
  body('newName').isString(), 
  validateErrors,
  async (req, res) => {
  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)
  const { pathToFile, newName } = req.body

  if (!fs.existsSync(path.join(rootDirectoryPath, pathToFile)))
    return res.status(404).send('Path does not exist')

  const pathWithoutFile = path.dirname(pathToFile)
  const fullPathWithoutFile = path.join(rootDirectoryPath, pathWithoutFile)
  
  try {
    await fs.promises.rename(path.join(rootDirectoryPath, pathToFile), path.join(fullPathWithoutFile, newName))
    log(`File rename request "${pathToFile}", to "${newName}" for "${req.clientIp}"`)
    emitFileChange(path.dirname(pathToFile), 'RENAME')
  } catch (error) {
    console.error(error)
    return res.status(500).send('Something went wrong')
  }

  return res.status(200).send("OK")
})

export default router