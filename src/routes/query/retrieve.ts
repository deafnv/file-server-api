import path from 'path'

import fs from 'fs-extra'
import express, { RequestHandler } from 'express'
import archiver from 'archiver'
import { minimatch } from 'minimatch'

import {
  isRetrieveRequireAuth,
  rootDirectoryPath,
  excludedDirs,
  protectedPaths,
} from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import log from '../../lib/log.js'

const router = express.Router()

const authHandler: RequestHandler = (req, res, next) => {
  if (isRetrieveRequireAuth || isRouteInArray(req, protectedPaths)) {
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

router.get('/:filepath(*)', authHandler, postAuthHandler, async (req, res) => {
  const filePath = req.params.filepath
  const filePathFull = path.join(rootDirectoryPath, filePath)

  //* Path traversal
  if (filePath.match(/\.\.[\/\\]/g)) return res.sendStatus(400)

  //* For use if downloading multiple files
  const selectedFiles = req.query.file

  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

  if (!(await fs.exists(filePathFull))) return res.status(404).send('File does not exist')
  if (
    selectedFiles?.length &&
    !(selectedFiles as string[]).every((selectedFile) =>
      fs.existsSync(path.join(filePathFull, selectedFile))
    )
  )
    return res.sendStatus(404)

  log({ req, eventType: 'RETRIEVE', eventPath: filePath })

  //* If files array provided in query param, send specified files in archive
  if ((await fs.stat(filePathFull)).isDirectory()) {
    let requestError = false
    const formattedDate = new Date().toISOString().replace(/[:\-]/g, '').slice(0, -5) + 'Z'
    const archiveFilePath = selectedFiles?.length
      ? path.join(filePathFull, `${path.parse(filePath).name}-${formattedDate}.zip`)
      : `${filePathFull}-${formattedDate}.zip`
    const output = fs.createWriteStream(archiveFilePath)
    const archive = archiver('zip')

    const fileCount = await countFilesRecursive(
      selectedFiles?.length
        ? (selectedFiles as string[]).map((selectedFile) => path.join(filePathFull, selectedFile))
        : filePathFull
    )

    //* Download directory or select files
    output.on('close', async () => {
      if (!requestError) {
        const fileSize = (await fs.stat(archiveFilePath)).size
        res.writeHead(200, {
          'Content-Disposition': `attachment; filename=${path.parse(archiveFilePath).base}`,
          'Content-Length': fileSize,
        })
        fs.createReadStream(archiveFilePath).pipe(res)
      }
    })

    //* Remove zip file after downloaded/req close
    req.on('close', () => {
      fs.rmSync(archiveFilePath, { recursive: true, force: true, maxRetries: 3 })
    })

    req.on('error', () => {
      requestError = true
      output.close()
    })

    //TODO: Send progress events
    archive.on('progress', (progress) => {
      const progressPercent = (progress.entries.processed / fileCount) * 100
    })

    archive.on('warning', (err: any) => {
      console.warn(err)
    })

    archive.on('error', (err: any) => {
      console.error(err)
      res.sendStatus(500)
    })

    archive.pipe(output)

    //* Archive selected files or directory
    selectedFiles?.length
      ? await archiveDir(
          (selectedFiles as string[]).map((selectedFile) => path.join(filePathFull, selectedFile))
        )
      : await archiveDir(filePathFull)
    archive.finalize()

    async function archiveDir(directoryPath: string | string[]) {
      let files: string[]

      if (typeof directoryPath == 'string') {
        files = await fs.readdir(directoryPath)
      } else {
        files = directoryPath.map((file) => path.basename(file))
        directoryPath = path.dirname(directoryPath[0])
      }

      for (const file of files) {
        const directoryFilePath = path.join(directoryPath, file)
        const normalize = directoryFilePath.replace(rootDirectoryPath, '').split(path.sep).join('/')
        const stat = await fs.stat(directoryFilePath)
        if (stat.isDirectory()) {
          await archiveDir(directoryFilePath)
        } else {
          if (!excludedDirs.some((excludedDir) => minimatch(normalize, excludedDir))) {
            archive.file(directoryFilePath, {
              name: file,
              prefix: directoryPath.replace(filePathFull, ''),
            })
          }
        }
      }
    }
  }
  //* Allow direct downloads
  else if (req.query.download) {
    const fileSize = (await fs.stat(filePathFull)).size
    res.writeHead(200, {
      'Content-Disposition': `attachment; filename=${path.parse(filePath).base}`,
      'Content-Length': fileSize,
    })
    return fs.createReadStream(filePathFull).pipe(res)
  } else {
    return res.sendFile(filePathFull)
  }
})

export default router

async function countFilesRecursive(directoryPath: string | string[]) {
  let count = 0
  let files: string[]

  if (typeof directoryPath == 'string') {
    files = await fs.readdir(directoryPath)
  } else {
    files = directoryPath.map((file) => path.basename(file))
    directoryPath = path.dirname(directoryPath[0])
  }

  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const stat = await fs.stat(filePath)

    if (stat.isDirectory()) {
      count += await countFilesRecursive(filePath)
      count++
    } else if (stat.isFile()) {
      count++
    }
  }

  return count
}
