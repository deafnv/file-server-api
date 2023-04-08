import { io } from '../index.js'

export default function emitFileChange(dirPath, eventPayload) {
  let parsedDir
  const rootPath = process.env.ROOT_DIRECTORY_PATH.trim()
  console.log(rootPath)
  if (dirPath.replaceAll('\\', '/').includes(rootPath)) {
    parsedDir = dirPath.replaceAll('\\', '/').replace(rootPath, '')
  } else parsedDir = dirPath.replaceAll('\\', '/')

  if (parsedDir.charAt(0) !== '/') {
    parsedDir = '/' + parsedDir
  }

  console.log(parsedDir)
  io.emit(parsedDir, eventPayload)
}