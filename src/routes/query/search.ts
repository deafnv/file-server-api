import path from 'path'

import express, { RequestHandler } from 'express'
import fs from 'fs-extra'
import Fuse from 'fuse.js'

import { prisma } from '../../index.js'
import {
  isListRequireAuth,
  dbEnabled,
  dbMetadataEnabled,
  protectedPaths,
  rootDirectoryPath,
} from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { fuse } from '../../lib/indexer.js'
import { FileMetadata, IndexItem } from '../../lib/types.js'

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

//TODO: Paginate search results, request for results beyond 50
router.get('/', authHandler, postAuthHandler, async (req, res) => {
  let { q: searchTerm, filter, parent } = req.query
  if (parent instanceof Array) parent = parent[0]
  let results: Fuse.default.FuseResult<IndexItem>[]

  //* Search based on type if specified
  if (filter == 'file' || filter == 'directory') {
    results = fuse.search({
      $and: [{ name: searchTerm }, { isDirectory: filter == 'file' ? 'false' : 'true' }],
    })
  } else {
    results = fuse.search(searchTerm)
  }

  //* Filter results only to those that are in the parent directory if specified
  if (parent) {
    let decodedParent = decodeURIComponent(parent as string)
    if (decodedParent.slice(-1) != '/') decodedParent = decodedParent + '/'
    results = results.filter((result) => result.item.path.startsWith(decodedParent))
  }

  //* Limit results to 50
  results = results.slice(0, 50)

  let resultsList = []

  if (results.length) {
    for (const result of results) {
      const { name, path: resultPath } = result.item
      const filePath = path.join(rootDirectoryPath, resultPath)

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

        resultsList.push({
          name: name,
          path: resultPath,
          size: fileStats.size,
          created: fileStats.birthtime,
          modified: fileStats.mtime,
          isDirectory: fileStats.isDirectory(),
          isShortcut: null,
          metadata,
        })
      } catch (error) {
        console.error(error)
        return res.status(500).send(error)
      }
    }
  }

  return res.status(200).send(resultsList)
})

export default router
