import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'

const router = express.Router()

router.patch('/', authorize, (req, res) => {
  const { pathToFile, newName } = req.body
  if (!pathToFile || !newName || typeof pathToFile !== 'string' || typeof newName !== 'string') 
    return res.status(400).send('Missing content')

  if (!fs.existsSync(path.join(process.env.ROOT_DIRECTORY_PATH, pathToFile)))
    return res.status(400).send('Path does not exist')

  const pathWithoutFile = pathToFile.split('/').slice(0, -1).join('/')
  const fullPathWithoutFile = path.join(process.env.ROOT_DIRECTORY_PATH, pathWithoutFile)
  
  fs.renameSync(path.join(process.env.ROOT_DIRECTORY_PATH, pathToFile), path.join(fullPathWithoutFile, newName))

  return res.status(200).send("OK")
})

export default router