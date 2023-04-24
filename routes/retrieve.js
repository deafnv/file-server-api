import express from 'express'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import archiver from 'archiver'

import { jwtSecret, rootDirectoryPath } from '../index.js'
import log from '../lib/log.js'

const router = express.Router()

router.get('/:filepath(*)', async (req, res) => {
  const filePath = req.params.filepath
  const filePathFull = path.join(rootDirectoryPath, filePath)
  log(`Download request for "${filePath}" received from "${req.clientIp}"`)

  if (!fs.existsSync(filePathFull)) return res.status(404).send("File does not exist")

  const securedRoutes = ['events-log.log']

  //* If secured route
  if (securedRoutes.includes(path.parse(filePath).base)) {
    const { token } = req.cookies
    if (!token) return res.status(401).send('This file requires a cookie token to access, try logging in')
    try {
      jwt.verify(token, jwtSecret)
    } catch (error) {
      console.log(error)
      return res.status(401).send('Invalid token provided')
    }
  } 
  //* Handle downloading directory
  //TODO: Send progress events
  else if (fs.lstatSync(filePathFull).isDirectory()) {
    const output = fs.createWriteStream(`${filePathFull}.zip`)
    const archive = archiver('zip')

    /* res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }) */

    //* Let client download zip file after done zip
    output.on('close', async () => {
      const fileSize = (await fs.promises.stat(`${filePathFull}.zip`)).size
      res.writeHead(200, {
        'Content-Disposition': `attachment; filename=${path.parse(filePathFull).name}.zip`,
        'Content-Length': fileSize
      })
      fs.createReadStream(`${filePathFull}.zip`).pipe(res)
      /* res.download(`${filePathFull}.zip`, `${filePathFull}.zip`, (err) => {
        if (err) {
          console.error(err)
        }
        fs.unlinkSync(`${filePathFull}.zip`)
      }) */
    })

    //* Remove zip file after downloaded/req close
    req.on('close', () => {
      fs.rmSync(`${filePathFull}.zip`, { recursive: true, force: true,  maxRetries: 3 })
    })
  
    archive.on('warning', (err) => {
      console.warn(err)
    })

    archive.on('error', (err) => {
      console.error(err)
      res.sendStatus(500)
    })

    //TODO: Give progress to client
    archive.on('progress', (progress) => {
      /* const { entries, fsSize } = progress;
      const percent = Math.round((progress.fs.processedBytes / fsSize) * 100);
      console.log(`Archiving ${entries.processed} out of ${entries.total} files (${percent}% complete)`);
      const message = JSON.stringify({ progress: percent }) */
      //res.write(`data: ${message}\n\n`)
    })
  
    archive.pipe(output)
    archive.directory(filePathFull, false)
    archive.finalize()
  } 
  //* Allow direct downloads
  else if (req.query.download) {
    const fileSize = (await fs.promises.stat(filePathFull)).size
    res.writeHead(200, {
      'Content-Disposition': `attachment; filename=${path.parse(filePath).base}`,
      'Content-Length': fileSize
    })
    return fs.createReadStream(filePathFull).pipe(res)
  } 
  else {
    return res.sendFile(filePathFull)
  }
})

export default router