import path from 'path'

import fs from 'fs-extra'
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
import { Prisma } from '@prisma/client'

let serverFileEvents = [
  'RETRIEVE',
  'UPLOAD',
  'DELETE',
  'COPY',
  'MOVE',
  'RENAME',
  'MAKEDIR',
  'METADATA',
  'SHORTCUT',
]
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
    eventUsername,
  }: {
    req: Request
    eventType: EventType
    eventPath?: string
    eventOld?: string
    eventNew?: string
    eventData?: string
    eventUsername?: string
  },
  ...args: any[]
) {
  logToFile(req, eventType, args)

  if (dbEnabled && dbLogsEnabled) {
    let decoded: string | jwt.JwtPayload
    try {
      decoded = jwt.verify(req.cookies.token, jwtSecret)
    } catch (error) {}
    const username = (decoded as jwt.JwtPayload)?.username || eventUsername

    let createLogData: Prisma.LogCreateInput = {
      user:
        dbUsersEnabled && username != undefined
          ? {
              connect: {
                username,
              },
            }
          : undefined,
      display_name: username != undefined ? username : null,
      ip_address: req.clientIp,
      log_events: {
        connect: {
          event_type: eventType,
        },
      },
      event_path: eventPath != undefined ? normalizePath(eventPath) : undefined,
      event_new: eventNew != undefined ? normalizePath(eventNew) : undefined,
      event_old: eventOld != undefined ? normalizePath(eventOld) : undefined,
      event_data: eventData,
    }

    const createLog = () => {
      prisma.log
        .create({ data: createLogData })
        .then(() => {})
        .catch((err) => console.error(err))
    }

    //* If event is file interaction
    if (serverFileEvents.includes(eventType)) {
      fs.stat(path.join(rootDirectoryPath, eventPath))
        .then(({ ino }) => {
          createLogData.file_id = ino.toString()
          createLog()
        })
        .catch((err) => {
          //* Errors when file already deleted, use previous log's file id
          if (eventType == 'DELETE') {
            prisma.log
              .findFirst({
                where: {
                  event_path: eventPath != undefined ? normalizePath(eventPath) : undefined,
                },
              })
              .then((previousLog) => {
                if (previousLog) createLogData.file_id = previousLog.file_id
                createLog()
              })
              .catch((err) => console.error(err))
          } else {
            //* Other errors
            console.error(err)
          }
        })
    } else {
      //* User related events, optional file events
      createLog()
    }
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
        `Upload request for file "${req.file.originalname}" received from "${req.clientIp}"`
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

export async function initLogEventTypes() {
  const eventsData: Prisma.LogEventsCreateInput[] = [
    {
      event_type: 'RETRIEVE',
      event_display_text: 'retrieved',
    },
    {
      event_type: 'UPLOAD',
      event_display_text: 'uploaded',
    },
    {
      event_type: 'DELETE',
      event_display_text: 'deleted',
    },
    {
      event_type: 'COPY',
      event_display_text: 'copied',
    },
    {
      event_type: 'MOVE',
      event_display_text: 'moved',
    },
    {
      event_type: 'RENAME',
      event_display_text: 'renamed',
    },
    {
      event_type: 'MAKEDIR',
      event_display_text: 'created',
    },
    {
      event_type: 'METADATA',
      event_display_text: 'changed metadata for',
    },
    {
      event_type: 'SHORTCUT',
      event_display_text: 'created a shortcut for',
    },
    {
      event_type: 'REGISTER',
      event_display_text: 'registered a new account',
    },
    {
      event_type: 'LOGIN',
      event_display_text: 'logged in',
    },
    {
      event_type: 'DELETEUSER',
      event_display_text: 'deleted account',
    },
    {
      event_type: 'APILOGIN',
      event_display_text: 'used API key to login',
    },
    {
      event_type: 'LOGOUT',
      event_display_text: 'logged out',
    },
    {
      event_type: 'VERIFY',
      event_display_text: 'verified token',
    },
  ]

  await prisma.$transaction(
    eventsData.map((eventData) =>
      prisma.logEvents.upsert({
        where: {
          event_type: eventData.event_type,
        },
        create: eventData,
        update: eventData,
      })
    )
  )
}
