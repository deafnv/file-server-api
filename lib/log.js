import fs from 'fs'
import path from 'path'

import { rootDirectoryPath } from '../index.js'

//* Use function: `File ${filename} downloaded by ${ipaddress}`
export default function log(data) {
  const logStream = fs.createWriteStream(path.join(rootDirectoryPath, 'events-log.log'), { flags: 'a' })
  const logText = `[${new Date().toISOString()}] ${data}\n`
  process.stdout.write(logText)
  logStream.write(logText)
  logStream.end()
}