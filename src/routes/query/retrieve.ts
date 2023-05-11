import fs from 'fs'
import path from 'path'

import express, { RequestHandler } from 'express'
import archiver from 'archiver'

import { isRetrieveRequireAuth, rootDirectoryPath, excludedDirs, protectedPathsAbsolute } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import log from '../../lib/log.js'

const router = express.Router()

const authHandler: RequestHandler = (req, res, next) => {
  const filePath = req.params.filepath
  if (isRetrieveRequireAuth || protectedPathsAbsolute.includes(path.join(rootDirectoryPath, `/${filePath}`))) {
    return authorize(req, res, next)
  } else {
    return next()
  }
}

const postAuthHandler: RequestHandler = (req, res, next) => {
  if (typeof isRetrieveRequireAuth == 'number') {
    if (req.jwt.rank < isRetrieveRequireAuth) return res.sendStatus(403)
  }
  return next()
}

//TODO: Exclude excluded/protected directories from directory download
router.get('/:filepath(*)', authHandler, postAuthHandler, async (req, res) => {
  const filePath = req.params.filepath
  const filePathFull = path.join(rootDirectoryPath, filePath)
  //* For use if downloading multiple files
  const selectedFiles = req.query.file

  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

  log(`Download request for "${filePath}" received from "${req.clientIp}"`)

  if (!fs.existsSync(filePathFull)) return res.status(404).send("File does not exist")

  //* If files array provided in query param, send specified files in archive
  if (fs.lstatSync(filePathFull).isDirectory() && selectedFiles?.length) {
    if (!(selectedFiles instanceof Array)) return res.sendStatus(400)
    const formattedDate = new Date().toISOString().replace(/[:\-]/g, '').slice(0, -5) + 'Z'
    const archiveFilePath = path.join(filePathFull, `${path.parse(filePath).name}-${formattedDate}.zip`)
    const output = fs.createWriteStream(archiveFilePath)
    const archive = archiver('zip')

    const fileCount = await countFilesRecursive((selectedFiles as string[]).map(selectedFile => path.join(filePathFull, selectedFile)))

    //* Let client download zip file after done zip
    output.on('close', async () => {
      const fileSize = (await fs.promises.stat(archiveFilePath)).size
      res.writeHead(200, {
        'Content-Disposition': `attachment; filename=${path.parse(archiveFilePath).base}`,
        'Content-Length': fileSize
      })
      fs.createReadStream(archiveFilePath).pipe(res)
    })

    //* Remove zip file after downloaded/req close
    req.on('close', () => {
      fs.rmSync(archiveFilePath, { recursive: true, force: true,  maxRetries: 3 })
    })

    //TODO: Send progress events
    archive.on('progress', (progress) => {
      const progressPercent = progress.entries.processed / fileCount * 100
    })
    
    archive.on('warning', (err: any) => {
      console.warn(err)
    })

    archive.on('error', (err: any) => {
      console.error(err)
      res.sendStatus(500)
    })

    archive.pipe(output)
    for (const selectedFile of selectedFiles) {
      archive.file(path.join(filePathFull, selectedFile.toString()), { name: path.parse(selectedFile.toString()).base })
    }
    archive.finalize()
  } 
  //* Handle downloading directory
  else if (fs.lstatSync(filePathFull).isDirectory()) {
    const output = fs.createWriteStream(`${filePathFull}.zip`)
    const archive = archiver('zip')

    const fileCount = await countFilesRecursive(filePathFull)

    //* Let client download zip file after done zip
    output.on('close', async () => {
      const fileSize = (await fs.promises.stat(`${filePathFull}.zip`)).size
      res.writeHead(200, {
        'Content-Disposition': `attachment; filename=${path.parse(filePathFull).name}.zip`,
        'Content-Length': fileSize
      })
      fs.createReadStream(`${filePathFull}.zip`).pipe(res)
    })

    //* Remove zip file after downloaded/req close
    req.on('close', () => {
      fs.rmSync(`${filePathFull}.zip`, { recursive: true, force: true,  maxRetries: 3 })
    })
  
    //TODO: Send progress events
    archive.on('progress', (progress) => {
      const progressPercent = progress.entries.processed / fileCount * 100
    })

    archive.on('warning', (err: any) => {
      console.warn(err)
    })

    archive.on('error', (err: any) => {
      console.error(err)
      res.sendStatus(500)
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

async function countFilesRecursive(directoryPath: string | string[]) {
  let count = 0
  let files: string[]

  if (typeof directoryPath == 'string') {
    files = await fs.promises.readdir(directoryPath)
  } else {
    files = directoryPath.map(file => path.basename(file))
    directoryPath = path.dirname(directoryPath[0])
  }

  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const stat = await fs.promises.stat(filePath)

    if (stat.isDirectory()) {
      count += await countFilesRecursive(filePath)
      count++
    } else if (stat.isFile()) {
      count++
    }
  }

  return count
}