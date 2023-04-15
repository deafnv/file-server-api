import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()

router.get('/:filename(*)', (req, res) => {
  const fileName = req.params.filename
  let queryPath = path.join(process.env.ROOT_DIRECTORY_PATH, fileName)
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
            res.status(500).send(err)
          } else {
            const fileObj = {
              name: file,
              path: filePath.replace(process.env.ROOT_DIRECTORY_PATH, ''),
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