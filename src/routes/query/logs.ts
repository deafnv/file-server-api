import path from 'path'

import fs from 'fs-extra'
import express, { RequestHandler } from 'express'

import { isLogsRequireAuth, protectedPaths, rootDirectoryPath } from '../../lib/config.js'
import authorize, { isRouteInArray } from '../../lib/authorize-func.js'
import { prisma } from '../../index.js'

const router = express.Router()

const authHandler: RequestHandler = (req, res, next) => {
  if (isLogsRequireAuth || isRouteInArray(req, protectedPaths)) {
    return authorize(req, res, next)
  } else {
    return next()
  }
}

const postAuthHandler: RequestHandler = (req, res, next) => {
  if (typeof isLogsRequireAuth == 'number') {
    if (req.jwt.rank < isLogsRequireAuth) return res.sendStatus(403)
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

  let fileIDQuery: string
  let pathQuery: any
  if (eventPath != undefined || eventInPath != undefined) {
    if (eventPath != undefined) {
      const currentFileID = await fs
        .stat(path.join(rootDirectoryPath, (eventPath as string) ?? ''))
        .catch(() => {})

      if (currentFileID) {
        fileIDQuery = currentFileID.ino.toString()
      } else {
        const fileID = await prisma.log.findFirst({
          where: {
            event_path: eventPath,
          },
          select: {
            file_id: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        })

        fileIDQuery = fileID ? fileID.file_id : undefined
      }
    }

    pathQuery = {
      startsWith: eventInPath,
      equals: fileIDQuery ? undefined : eventPath,
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
      file_id: fileIDQuery,
      OR: userQuery,
    },
    include: {
      log_events: {
        select: {
          event_display_text: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return res.status(200).send(results)
})

export default router
