import { io } from '../index.js'

export default function emitFileChange(dirPath, eventPayload) {
  let parsedDir
  const rootPath = process.env.ROOT_DIRECTORY_PATH.trim()

  if (dirPath.replaceAll('\\', '/').includes(rootPath)) {
    parsedDir = dirPath.replaceAll('\\', '/').replace(rootPath, '')
  } else parsedDir = dirPath.replaceAll('\\', '/')

  if (parsedDir.charAt(0) !== '/') {
    parsedDir = '/' + parsedDir
  }

  io.emit(parsedDir, eventPayload)
  io.emit('filetree', 'RELOAD')
}

export function emitEncodingProgress(eventPayload) {
  io.emit('encoding', eventPayload)
}