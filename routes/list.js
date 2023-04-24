import express from 'express'
import fs from 'fs'
import path from 'path'

import { rootDirectoryPath } from '../index.js'

const router = express.Router()

router.get('/:filename(*)', (req, res) => {
  const fileName = req.params.filename
  let queryPath = path.join(rootDirectoryPath, fileName)
  fs.readdir(queryPath, (err, files) => {
    if (err) {
      if (err.errno == -4058) 
        return res.status(404).send('Directory does not exist')
      res.status(500).send(err)
    } else {
      if (files.length == 0) 
        return res.status(200).send([])

      const fileList = [];

      files.forEach((file) => {
        const filePath = path.join(queryPath, file)

        fs.stat(filePath, (err, stats) => {
          if (err) {
            throw new Error('failed fs.stat') //FIXME: temp fix for upload error, will restart server on partial upload file interactions
          } else {
            const fileObj = {
              name: file,
              path: filePath.replace(rootDirectoryPath, ''),
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              isDirectory: stats.isDirectory()
            }

            fileList.push(fileObj);

            if (fileList.length === files.length) {
              res.status(200).send(fileList)
            }
          }
       })
      })
    }
  })
})

export default router