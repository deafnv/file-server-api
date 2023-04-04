import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'

const router = express.Router()

router.post('/', authorize, (req, res) => {
  const { newDirName, currentPath } = req.body
  if (typeof newDirName != 'string' || typeof currentPath != 'string' || !newDirName || !currentPath)
    return res.status(400).send('Missing required body')
  let queryPath = path.join(process.env.ROOT_DIRECTORY_PATH, currentPath, newDirName)

  log(`Directory create request "${currentPath}", name "${newDirName}" for "${req.clientIp}"`)
  fs.mkdir(queryPath, (err) => {
    if (err) {
        console.log(err)
        return res.status(500).send(err)
    }
    return res.status(201).send('OK')
  })
})

export default router