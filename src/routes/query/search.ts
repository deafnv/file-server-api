import path from 'path'

import express, { RequestHandler } from 'express'
import fs from 'fs-extra'
import omit from 'lodash/omit.js'

import {
  isListRequireAuth,
  metadataEnabled,
  protectedPaths,
  rootDirectoryPath,
} from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { fuse } from '../../lib/indexer.js'

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

router.get('/', authHandler, postAuthHandler, async (req, res) => {
  const { q: searchTerm, filter } = req.query
  let results: any[]

  if (filter == 'directory') {
    results = fuse.search({ $and: [{ name: searchTerm }, { isDirectory: 'true' }] }, { limit: 50 })
  } else {
    results = fuse.search(searchTerm, { limit: 50 })
  }

  let resultsList = []

  if (results.length) {
    for (const result of results) {
      const { name, path: resultPath } = result.item
      const filePath = path.join(rootDirectoryPath, resultPath)

      try {
        const fileStats = await fs.stat(filePath)
        const metadata =
          fileStats.isDirectory() &&
          metadataEnabled &&
          (await fs.exists(path.join(filePath, '.metadata.json')))
            ? JSON.parse(await fs.readFile(path.join(filePath, '.metadata.json'), 'utf-8'))
            : {}
        resultsList.push({
          name: name,
          path: resultPath,
          size: fileStats.size,
          created: fileStats.birthtime,
          modified: fileStats.mtime,
          isDirectory: fileStats.isDirectory(),
          isShortcut: null,
          metadata: Object.keys(metadata).length ? omit(metadata, ['name', 'path']) : undefined,
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
