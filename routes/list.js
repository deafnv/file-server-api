import express from 'express'
import fs from 'fs'
import path from 'path'

import { isListRequireAuth, rootDirectoryPath, excludedDirsAbsolute } from '../index.js'
import authorize from '../lib/authorize-func.js'

const router = express.Router()

const authHandler = (req, res, next) => isListRequireAuth ? authorize(req, res, next) : next()

router.get('/:filename(*)', authHandler, (req, res) => {
  const fileName = req.params.filename

  //* Excluded directory
  if (excludedDirsAbsolute.includes(path.join(rootDirectoryPath, `/${fileName}`))) return res.sendStatus(404)

  let queryPath = path.join(rootDirectoryPath, fileName)
  fs.readdir(queryPath, async (err, files) => {
    if (err) {
      if (err.errno == -4058) 
        return res.status(404).send('Directory does not exist')
      res.status(500).send(err)
    } else {
      if (files.length == 0) 
        return res.status(200).send([])

      const fileList = await Promise.all(files.map(async file => {
        const filePath = path.join(queryPath, file)
        const displayFilePath = filePath.replace(rootDirectoryPath, '').replaceAll('\\', '/')

        //* Exclude excluded directories
        if (excludedDirsAbsolute.includes(filePath)) return

        try {
          const fileStats = await fs.promises.stat(filePath)
          const fileObj = {
            name: file,
            path: displayFilePath.charAt(0) != '/' ? `/${displayFilePath}` : displayFilePath,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            isDirectory: fileStats.isDirectory()
          }
  
          return fileObj
        } catch (error) {
          console.error(error)
          return 'error'
        }
      }))

      if (fileList.some(item => typeof item == 'string')) return res.sendStatus(500)

      return res.status(200).send(fileList.filter(i => i))
    }
  })
})

export default router