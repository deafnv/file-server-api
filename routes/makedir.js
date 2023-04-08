import express from 'express'
import fs from 'fs'
import path from 'path'
import authorize from '../lib/authorize-func.js'
import log from '../lib/log.js'
import emitFileChange from '../lib/live.js'

const router = express.Router()

router.post('/', authorize, (req, res) => {
  const { newDirName, currentPath } = req.body
  if (typeof newDirName != 'string' || typeof currentPath != 'string' || !newDirName || !currentPath)
    return res.status(400).send('Missing required body')
  let queryPath = path.join(process.env.ROOT_DIRECTORY_PATH, currentPath, newDirName)

  fs.mkdir(queryPath, (err) => {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }
    log(`Directory create request "${currentPath}", name "${newDirName}" for "${req.clientIp}"`)
    emitFileChange(currentPath, 'NEWDIR')
    return res.status(201).send('OK')
  })
})

export default router