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
  const isJson = fileExtension == 'json'

  if (isVideoFile) {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': `video/${fileExtension}`,
    }

    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  } else if (isJson) {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'application/json',
    }

    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
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
      'Content-Type': 'application/octet-stream',
    }

    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
})

export default router