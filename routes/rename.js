import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'

const router = express.Router()

router.patch('/', authorize, async (req, res) => {
  const { pathToFile, newName } = req.body
  if (!pathToFile || !newName || typeof pathToFile !== 'string' || typeof newName !== 'string') 
    return res.status(400).send('Missing content')

  if (!fs.existsSync(path.join(process.env.ROOT_DIRECTORY_PATH, pathToFile)))
    return res.status(400).send('Path does not exist')

  const pathWithoutFile = pathToFile.split('/').slice(0, -1).join('/')
  const fullPathWithoutFile = path.join(process.env.ROOT_DIRECTORY_PATH, pathWithoutFile)
  
  try {
    await fs.promises.rename(path.join(process.env.ROOT_DIRECTORY_PATH, pathToFile), path.join(fullPathWithoutFile, newName))
    log(`File rename request "${pathToFile}", to "${newName}" for "${req.clientIp}"`)
  } catch (error) {
    console.log(error)
    return res.status(500).send('Something went wrong')
  }

  return res.status(200).send("OK")
})

export default router