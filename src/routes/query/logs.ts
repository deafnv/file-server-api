import express, { RequestHandler } from 'express'

import { isListRequireAuth, protectedPaths } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { prisma } from '../../index.js'

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
  let { path: eventPath, inpath: eventInPath, type: eventType, user: eventUser } = req.query
  if (eventPath instanceof Array) eventPath = eventPath[0]
  if (eventInPath instanceof Array) eventInPath = eventInPath[0]
  if (eventType instanceof Array) eventType = eventType[0]
  if (eventUser instanceof Array) eventUser = eventUser[0]

  if (!eventPath && !eventInPath && !eventType && !eventUser)
    return res.status(400).send('Require at least one filter')

  //* Prioritize direct path
  if (eventPath && eventInPath) eventInPath = undefined

  let pathQuery: any
  if (eventPath != undefined || eventInPath != undefined) {
    pathQuery = {
      equals: eventPath,
      startsWith: eventInPath,
    }
  }

  let userQuery: any
  if (eventUser != undefined) {
    userQuery = [
      {
        username: eventUser as string,
      },
      {
        display_name: eventUser as string,
      },
    ]
  }

  const results = await prisma.log.findMany({
    where: {
      event_type: eventType,
      event_path: pathQuery,
      OR: userQuery,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return res.status(200).send(results)
})

export default router
