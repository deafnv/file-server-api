import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'
import emitFileChange from '../lib/live.js'

const router = express.Router()

router.delete('/', authorize, async (req, res) => {
  const { pathToFiles } = req.body

  if (!(pathToFiles instanceof Array) || pathToFiles.length == 0 || pathToFiles.some(file => typeof file !== 'string'))
    return res.status(400).send('Bad content')

  let failedFiles = []

  for (const file of pathToFiles) {
    const fullFilePath = path.join(process.env.ROOT_DIRECTORY_PATH, file)

    if (!fs.existsSync(fullFilePath)) {
      failedFiles.push(file)
      continue
    }

    try {
      await fs.promises.rm(fullFilePath, { recursive: true, force: true,  maxRetries: 3 })
      log(`File delete request "${fullFilePath}" for "${req.clientIp}"`)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  emitFileChange(pathToFiles[0].split('/').slice(0, -1).join('/'), 'DELETE')

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send('OK')
})

export default router