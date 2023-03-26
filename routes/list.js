import express from 'express'
import fs from 'fs'

const router = express.Router()

router.get('/:filename(*)', (req, res) => {
  const fileName = req.params.filename
  let queryPath = process.env.ROOT_DIRECTORY_PATH + '/' + (fileName ? fileName + '/' : '') 
  fs.readdir(queryPath, (err, files) => {
    if (err) {
      if (err.errno == -4058) 
        return res.status(200).send('Directory does not exist')
      res.status(500).send(err)
    } else {
      if (files.length == 0) 
        return res.status(200).send([])

      const fileList = [];

      files.forEach((file) => {
        const filePath = `${queryPath}${file}`;

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