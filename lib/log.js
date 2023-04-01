import fs from 'fs'
import path from 'path'

//* Use function: `File ${filename} downloaded by ${ipaddress}`
export default function log(data) {
  const logStream = fs.createWriteStream(path.join(process.env.ROOT_DIRECTORY_PATH, 'events-log.log'), { flags: 'a' })
  logStream.write(`[${new Date().toISOString()}] ${data}\n`)
  logStream.end()
}