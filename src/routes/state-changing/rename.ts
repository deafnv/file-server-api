import path from 'path'

import fs from 'fs-extra'
import express from 'express'
import { body } from 'express-validator'

import { excludedDirs, metadataEnabled, rootDirectoryPath } from '../../lib/config.js'
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

  if (!(await fs.exists(path.join(rootDirectoryPath, pathToFile))))
    return res.status(404).send('Path does not exist')

  const pathWithoutFile = path.dirname(pathToFile)
  const newFilePath = path.join(rootDirectoryPath, pathWithoutFile, newName)
  
  try {
    if (path.basename(pathToFile).includes('.shortcut.json')) {
      let oldShortcutData = JSON.parse(await fs.readFile(path.join(rootDirectoryPath, pathToFile), 'utf8'))
      oldShortcutData.shortcutName = newName

      await fs.writeFile(path.join(rootDirectoryPath, pathToFile), JSON.stringify(oldShortcutData, null, 2), 'utf8')

      log(`File rename request "${pathToFile}" to "${newName}" for "${req.clientIp}"`)
      emitFileChange(path.dirname(pathToFile), 'RENAME')
      return res.sendStatus(200)
    }

    const isFileDirectory = (await fs.stat(path.join(rootDirectoryPath, pathToFile))).isDirectory()
    let oldMetadata = metadataEnabled && isFileDirectory ? JSON.parse(await fs.readFile(path.join(rootDirectoryPath, pathToFile, '.metadata.json'), 'utf8')) : undefined
    await fs.rename(path.join(rootDirectoryPath, pathToFile), newFilePath)
    
    if (metadataEnabled && isFileDirectory) {
      const newMetadata = {
        name: newName,
        path: newFilePath.replace(rootDirectoryPath, '').charAt(0) == path.sep ? `${newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/')}` : `/${newFilePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/')}`
      }

      let combined = oldMetadata
      Object.keys(newMetadata).forEach(key => {
        combined[key] = newMetadata[key]
      })
    
      await fs.writeFile(path.join(newFilePath, '.metadata.json'), JSON.stringify(combined, null, 2), 'utf8')
    }
    
    log(`File rename request "${pathToFile}" to "${newName}" for "${req.clientIp}"`)
    emitFileChange(path.dirname(pathToFile), 'RENAME')
  } catch (error) {
    console.error(error)
    return res.status(500).send('Something went wrong')
  }

  return res.sendStatus(200)
})

export default router