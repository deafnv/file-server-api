import express from 'express'
import fs from 'fs'

const router = express.Router()

router.get('/', (req, res) => {
  fs.readdir(process.env.ROOT_DIRECTORY_PATH, (err, files) => {
    if (err) {
      res.status(500).send(err)
    } else {
      const fileList = [];

      files.forEach((file) => {
        const filePath = `${process.env.ROOT_DIRECTORY_PATH}/${file}`;

        fs.stat(filePath, (err, stats) => {
          if (err) {
            res.status(500).send(err)
          } else {
            const fileObj = {
              name: file,
              path: filePath,
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