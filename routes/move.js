import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'

const router = express.Router()

router.post('/', authorize, async (req, res) => {
  const { pathToFiles, newPath } = req.body

  if (!(pathToFiles instanceof Array) || pathToFiles.length == 0 || !newPath || typeof newPath !== 'string')
    return res.status(400).send('Bad content')
  
  let failedFiles = []

  for (const file of pathToFiles) {
    const fileName = path.parse(file).base
    const newFilePath = path.join(process.env.ROOT_DIRECTORY_PATH, newPath, fileName)

    try {
      await fs.promises.rename(path.join(process.env.ROOT_DIRECTORY_PATH, file), newFilePath)
    } catch (error) {
      failedFiles.push(file)
      console.log(error)
    }
  }

  if (failedFiles.length)
    return res.status(200).send({
      message: 'Some files failed',
      failedFiles
    })

  return res.status(200).send("OK")
})

export default router