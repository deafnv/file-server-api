import express from 'express'
import cors from 'cors'
import http from 'http'
import fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config()
const rootDirectory = process.env.ROOT_DIRECTORY_PATH

const app = express()

app.use(
  cors({origin: ['http://localhost:3000', 'http://192.168.0.102:3000', 'http://127.0.0.1:3000']})
)

app.use(express.json())

app.get('/list', (req, res) => {
  fs.readdir(rootDirectory, (err, files) => {
    if (err) {
      res.status(500).send(err)
    } else {
      const fileList = [];

      files.forEach((file) => {
        const filePath = `${rootDirectory}/${file}`;

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

const httpServer = http.createServer(app)

httpServer.listen(3007, () => {
  console.log('HTTP Server running on port 3007');
})