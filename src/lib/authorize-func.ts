import { Request, RequestHandler } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

import { prisma } from '../index.js'
import { adminRank, dbEnabled, fsApiKeys, isListRequireAuth, jwtSecret, protectedPaths } from '../lib/config.js'
import path from 'path'

declare module 'express-serve-static-core' {
  interface Request {
    jwt?: JwtPayload
  }
}

const authorize: RequestHandler = async (req, res, next) => {
  const { token } = req.cookies
  if (req.headers["x-api-key"] == undefined && !token) return res.status(401).send('This route requires an API key header: X-API-Key, or a token cookie')

  if (req.headers["x-api-key"]) {
    if (!fsApiKeys.includes(req.headers["x-api-key"])) return res.status(401).send('Wrong API key')
    //* Pass along admin jwt for api key
    const adminJwt = jwt.sign({
      username: 'admin',
      rank: 99999
    }, jwtSecret)
    const decoded = jwt.verify(adminJwt, jwtSecret)
    req.jwt = decoded as JwtPayload
    return next()
  }
  
  try {
    const { originalUrl } = req
    const targetPath = originalUrl.split('/')[1]
    const decoded = jwt.verify(token, jwtSecret)
    req.jwt = decoded as JwtPayload

    //* If target directory is a protected path
    if (isRouteInArray(req, protectedPaths)) {
      if ((decoded as JwtPayload).rank > adminRank) return next()
      return res.sendStatus(403)
    }

    //* If db not enabled, and logged in
    if (decoded && !dbEnabled) return next()

    //* if logged in and accessing non-state changing routes
    if (['list', 'filetree', 'retrieve'].includes(targetPath)) return next()

    //* Check if permissions allow
    const userData = await prisma.user.findFirst({ where: { username: (decoded as JwtPayload).username } })

    //* Token invalidated
    if (!userData || (decoded as JwtPayload).jti != userData.jti) {
      res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
      return res.sendStatus(401)
    }
    
    //* JWT has permissions or is admin rank
    if ((decoded as JwtPayload).permissions[targetPath] || (decoded as JwtPayload).rank >= adminRank) {
      return next()
    } else {
      return res.sendStatus(403)
    }
  } catch (error) {
    console.error(error)
    res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'none', secure: true })
    return res.status(401).send('Invalid token provided')
  }
}

export default authorize

//* Checks if the targeted directory is or is the subdirectory of an array of protected directories
export function isRouteInArray(req: Request, routesToCheckRaw: string[]) {
  const routesToCheck = routesToCheckRaw.map(dir => dir.split(path.sep).join('/'))
  const { originalUrl } = req
  const targetPath = originalUrl.split('/')[1] //* list, upload
  const pathInURL = ['list', 'retrieve', 'upload'].includes(targetPath)

  if (pathInURL) {
    return routesToCheck.some(routeToCheck => `/${decodeURIComponent(originalUrl.split('/').slice(2).join('/'))}`.startsWith(routeToCheck))
  } else {
    let pathInBody: any
    switch (targetPath) {
      case 'delete':
        pathInBody = req.body.pathToFiles
        return routesToCheck.some(routeToCheck => pathInBody.some((item: string) => item.startsWith(routeToCheck)))
      case 'makedir':
        pathInBody = req.body.currentPath
        return routesToCheck.some(routeToCheck => pathInBody.startsWith(routeToCheck))
      case 'move':
      case 'copy':
        pathInBody = req.body.pathToFiles.concat(req.body.newPath)
        return routesToCheck.some(routeToCheck => pathInBody.some((item: string) => item.startsWith(routeToCheck)))
      case 'rename':
        pathInBody = req.body.pathToFile
        return routesToCheck.some(routeToCheck => pathInBody.startsWith(routeToCheck))
      default:
        return null
    }
  }
}