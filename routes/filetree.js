import express from 'express'
import fs from 'fs'
import path from 'path'
import { rootDirectoryPath } from '../index.js'

const router = express.Router()

router.get('/', (req, res) => {
  createFileTree(rootDirectoryPath).then(fileTree => {
    return res.status(200).send(fileTree)
  }).catch(err => {
    console.error(err)
    return res.status(500).send('Something went wrong')
  })
})

export default router

function createFileTree(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return reject(err)
      }

      files.sort((a, b) => a.localeCompare(b))

      const fileTree = {}

      let remaining = files.length

      if (!remaining) {
        return resolve(fileTree)
      }

      files.forEach(file => {
        const filePath = path.join(dir, file)

        fs.stat(filePath, (err, stats) => {
          if (err) {
            if (--remaining === 0) {
              resolve(fileTree)
            }

            return
          }

          if (stats.isDirectory()) {
            createFileTree(filePath).then(subtree => {
              fileTree[file] = subtree

              if (--remaining === 0) {
                resolve(fileTree)
              }
            }).catch(reject)
          } else {
            if (--remaining === 0) {
              resolve(fileTree)
            }
          }
        })
      })
    })
  })
}