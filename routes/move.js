import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'
import emitFileChange from '../lib/live.js'

const router = express.Router()

router.post('/', authorize, async (req, res) => {
  const { pathToFiles, newPath } = req.body

  if (!(pathToFiles instanceof Array) || pathToFiles.length == 0 || pathToFiles.some(file => typeof file !== 'string') || !newPath || typeof newPath !== 'string')
    return res.status(400).send('Bad content')
  
  let failedFiles = []

  for (const file of pathToFiles) {
    const fileName = path.parse(file).base
    const newFilePath = path.join(process.env.ROOT_DIRECTORY_PATH, newPath, fileName)

    try {
      await fs.promises.rename(path.join(process.env.ROOT_DIRECTORY_PATH, file), newFilePath)
      log(`File move request "${file}", to "${newPath}" for "${req.clientIp}"`)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  //* Emit change for both outgoing and incoming directories
  emitFileChange(path.dirname(pathToFiles[0]), 'MOVE')
  emitFileChange(newPath, 'MOVE')

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send("OK")
})

export default router