import express from 'express'
import fs from 'fs'

const router = express.Router()

router.get('/:filepath(*)', (req, res) => {
  const filePath = req.params.filepath
  let path = process.env.ROOT_DIRECTORY_PATH + '/' + (filePath ? filePath + '/' : '')

  if (fs.lstatSync(path).isDirectory()) return res.status(400).send('Path is directory, not file')
  
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range

  const fileExtension = filePath.split('/')[filePath.split('/').length - 1].split('.').pop().toLowerCase()
  const isVideoFile = ['mp4', 'webm', 'ogg'].includes(fileExtension)

  if (isVideoFile) {
    let range = req.headers.range
    if (!range) {
        range = 'bytes=0-'
    }

    const CHUNK_SIZE = 10 ** 6
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, fileSize - 1)

    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      'Content-Length': (end-start)+1,
      'Content-Type': `video/${fileExtension}`,
    }

    res.writeHead(206, head)
    fs.createReadStream(path, { start, end }).pipe(res)
  } else if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize-1
    const chunksize = (end-start)+1
    const file = fs.createReadStream(path, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
    }

    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
    }

    res.type(fileExtension)
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
})

export default router