import express, { RequestHandler } from 'express'

import { isListRequireAuth, protectedPaths } from '../../lib/config.js'
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
  const searchTerm = req.query.q
  const results = fuse.search(searchTerm, { limit: 50 })

  return res.status(200).send(results)
})

export default router
