import fs from 'fs'
import path from 'path'

import { Request } from 'express'
import jwt from 'jsonwebtoken'

import {
  dbEnabled,
  dbLogsEnabled,
  dbUsersEnabled,
  jwtSecret,
  rootDirectoryPath,
} from '../lib/config.js'
import { io, prisma } from '../index.js'

type EventType = ServerFileEvents | ServerOptionalEvents | ServerUserEvents
type ServerFileEvents = 'RETRIEVE' | 'UPLOAD' | 'DELETE' | 'COPY' | 'MOVE' | 'RENAME' | 'MAKEDIR'
type ServerOptionalEvents = 'METADATA' | 'SHORTCUT'
type ServerUserEvents = 'REGISTER' | 'LOGIN' | 'DELETEUSER' | 'APILOGIN' | 'LOGOUT' | 'VERIFY'

export default function log(
  {
    req,
    eventType,
    eventPath,
    eventOld,
    eventNew,
    eventData,
  }: {
    req: Request
    eventType: EventType
    eventPath?: string
    eventOld?: string
    eventNew?: string
    eventData?: string
  },
  ...args: any[]
) {
  logToFile(req, eventType, args)

  if (dbEnabled && dbLogsEnabled) {
    let decoded: string | jwt.JwtPayload
    try {
      decoded = jwt.verify(req.cookies.token, jwtSecret)
    } catch (error) {}

    const username = (decoded as jwt.JwtPayload)?.username
    prisma.log
      .create({
        data: {
          username: dbUsersEnabled && username != undefined ? username : null,
          display_name: username != undefined ? username : null,
          ip_address: req.clientIp,
          event_type: eventType,
          event_path: eventPath != undefined ? normalizePath(eventPath) : undefined,
          event_new: eventNew != undefined ? normalizePath(eventNew) : undefined,
          event_old: eventOld != undefined ? normalizePath(eventOld) : undefined,
          event_data: eventData,
        },
      })
      .then(() => {})
      .catch((err) => console.error(err))
  }

  io.emit('LOG', 'RELOAD')
}

function logToFile(req: Request, eventType: EventType, args: any[]) {
  function writeToFile(logMessage: string) {
    const logStream = fs.createWriteStream(path.join(rootDirectoryPath, 'events-log.log'), {
      flags: 'a',
    })
    const logText = `[${new Date().toISOString()}] ${logMessage}\n`
    process.stdout.write(logText)
    logStream.write(logText)
    logStream.end()
  }

  switch (eventType) {
    case 'RETRIEVE':
      writeToFile(`Download request for "${req.params.filepath}" received from "${req.clientIp}"`)
      break
    case 'UPLOAD':
      writeToFile(
        `Upload request for file "${args[0].originalname}" received from "${req.clientIp}"`
      )
      break
    case 'DELETE':
      writeToFile(`File delete request "${args[0]}" for "${req.clientIp}"`)
      break
    case 'COPY':
      writeToFile(`Copy request "${args[0]}", to "${req.body.newPath}" for "${req.clientIp}"`)
      break
    case 'MOVE':
      writeToFile(`File move request "${args[0]}", to "${req.body.newPath}" for "${req.clientIp}"`)
      break
    case 'RENAME':
      let { pathToFile, newName } = req.body
      writeToFile(
        `File rename request "${normalizePath(pathToFile)}" to "${newName}" for "${req.clientIp}"`
      )
      break
    case 'MAKEDIR':
      let { newDirName, currentPath: currentPathMakeDir } = req.body
      writeToFile(
        `Create new directory request in "${normalizePath(
          currentPathMakeDir
        )}, name "${newDirName}" for "${req.clientIp}"`
      )
      break
    case 'METADATA':
      let { directories }: { directories: string[] } = req.body
      writeToFile(
        `Metadata changed for ${
          directories.length > 1 ? `${directories.length} files` : `"${directories[0]}"`
        } by "${req.clientIp}"`
      )
      break
    case 'SHORTCUT':
      let { target, currentPath: currentPathShortcut } = req.body
      writeToFile(
        `Shortcut for "${target}" created in "${currentPathShortcut}" by "${req.clientIp}"`
      )
      break
    case 'REGISTER':
      writeToFile(`Register account request received from "${req.clientIp}"`)
      break
    case 'LOGIN':
      writeToFile(`Login request received from "${req.clientIp}"`)
      break
    case 'DELETEUSER':
      writeToFile(`Delete account request received from "${req.clientIp}"`)
      break
    case 'APILOGIN':
      writeToFile(`API key login request received from "${req.clientIp}"`)
      break
    case 'LOGOUT':
      writeToFile(`Logout request from "${req.clientIp}"`)
      break
    case 'VERIFY':
      writeToFile(`Verification request received from "${req.clientIp}"`)
      break
  }
}

//TODO: utility function, move elsewhere
function normalizePath(filepath: string) {
  return filepath.charAt(0) != '/' ? `/${filepath}` : filepath
}
