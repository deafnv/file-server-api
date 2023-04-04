import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'

const router = express.Router()

router.delete('/', authorize, async (req, res) => {
  const { pathToFiles } = req.body

  let failedFiles = []

  for (const file of pathToFiles) {
    const fullFilePath = path.join(process.env.ROOT_DIRECTORY_PATH, file)

    if (!fs.existsSync(fullFilePath)) {
      failedFiles.push(file)
      continue
    }

    await fs.promises.rm(fullFilePath, { recursive: true, force: true,  maxRetries: 3 })
  }

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed, does not exist',
      failedFiles
    })

  return res.status(200).send('OK')
})

export default router