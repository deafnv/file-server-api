import path from 'path'

import fs from 'fs-extra'
import express, { RequestHandler } from 'express'
import { minimatch } from 'minimatch'

import {
  isListRequireAuth,
  rootDirectoryPath,
  protectedPaths,
  excludedDirs,
  dbEnabled,
  dbMetadataEnabled,
} from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { prisma } from '../../index.js'
import { FileMetadata } from '../../lib/types.js'

const router = express.Router()

const authHandler: RequestHandler = (req, res, next) => {
  if (isListRequireAuth || isRouteInArray(req, protectedPaths)) {
    return authorize(req, res, next)
  } else {
    return next()
  }
}

const postAuthHandler: RequestHandler = (req, res, next) => {
  if (typeof isListRequireAuth == 'number') {
    if (req.jwt.rank < isListRequireAuth) return res.sendStatus(403)
  }
  return next()
}

router.get('/:filename(*)', authHandler, postAuthHandler, async (req, res) => {
  const fileName = req.params.filename
  let queryPath = path.join(rootDirectoryPath, fileName)

  //* Path traversal
  if (fileName.match(/\.\.[\/\\]/g)) return res.sendStatus(400)

  //* Excluded directory
  if (isRouteInArray(req, excludedDirs)) return res.sendStatus(404)

  try {
    const files = await fs.readdir(queryPath)

    if (files.length == 0) return res.status(200).send([])

    let fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(queryPath, file)
        const displayFilePath = filePath.replace(rootDirectoryPath, '').replaceAll('\\', '/')

        //* Exclude excluded directories
        if (
          excludedDirs.some((item) =>
            minimatch(
              `${fileName}/${file}`.charAt(0) == '/'
                ? `${fileName}/${file}`
                : `/${fileName}/${file}`,
              item
            )
          )
        )
          return

        if (file.includes('.shortcut.json')) {
          try {
            const fileStats = await fs.stat(filePath)

            //TODO: Validate shortcut data
            const shortcutData = JSON.parse(await fs.readFile(filePath, 'utf8'))
            const targetStats = await fs
              .stat(path.join(rootDirectoryPath, shortcutData.target))
              .catch(() => {})
            let metadata: FileMetadata
            if (dbEnabled && dbMetadataEnabled && targetStats) {
              const dbMetadata = await prisma.metadata.findFirst({
                where: {
                  file_id: targetStats.ino.toString(),
                },
              })
              if (dbMetadata) metadata = JSON.parse(dbMetadata.metadata)
            }

            const fileObj = {
              name: shortcutData?.shortcutName,
              path: shortcutData?.target,
              size: shortcutData?.targetData?.size,
              created: fileStats.birthtime,
              modified: fileStats.mtime,
              isDirectory: shortcutData?.targetData?.isDirectory,
              isShortcut: {
                shortcutName: file,
                shortcutPath:
                  displayFilePath.charAt(0) != '/' ? `/${displayFilePath}` : displayFilePath,
              },
              metadata,
            }

            return fileObj
          } catch (error) {
            console.error(error)
            return 'error'
          }
        } else {
          try {
            const fileStats = await fs.stat(filePath)

            let metadata: FileMetadata
            if (dbEnabled && dbMetadataEnabled) {
              const dbMetadata = await prisma.metadata.findFirst({
                where: {
                  file_id: fileStats.ino.toString(),
                },
              })
              if (dbMetadata) metadata = JSON.parse(dbMetadata.metadata)
            }

            const fileObj = {
              name: file,
              path: displayFilePath.charAt(0) != '/' ? `/${displayFilePath}` : displayFilePath,
              size: fileStats.size,
              created: fileStats.birthtime,
              modified: fileStats.mtime,
              isDirectory: fileStats.isDirectory(),
              isShortcut: null,
              metadata,
            }

            return fileObj
          } catch (error) {
            console.error(error)
            return 'error'
          }
        }
      })
    )

    if (fileList.some((item) => typeof item == 'string')) return res.sendStatus(500)

    return res.status(200).send(fileList.filter((i) => i))
  } catch (error) {
    if (error.errno == -4058) return res.status(404).send('Directory does not exist')
    return res.status(500).send(error)
  }
})

export default router
