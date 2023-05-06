import { io } from '../index.js'
import { rootDirectoryPath } from '../lib/config.js'

export default function emitFileChange(dirPath: string, eventPayload: any) {
  let parsedDir: string
  const rootPath = rootDirectoryPath.trim()

  if (dirPath.replaceAll('\\', '/').includes(rootPath)) {
    parsedDir = dirPath.replaceAll('\\', '/').replace(rootPath, '')
  } else parsedDir = dirPath.replaceAll('\\', '/')

  if (parsedDir.charAt(0) !== '/') {
    parsedDir = '/' + parsedDir
  }

  io.emit(parsedDir, eventPayload)
  io.emit('filetree', 'RELOAD')
}