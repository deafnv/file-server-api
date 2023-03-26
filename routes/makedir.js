import express from 'express'
import fs from 'fs'

const router = express.Router()

router.post('/', (req, res) => {
  const { dirname, path } = req.body
  if (typeof dirname != 'string' || typeof path != 'string' || !dirname || !path)
    return res.status(400).send('Missing required body')
  let queryPath = process.env.ROOT_DIRECTORY_PATH + path + '/' + dirname

  fs.mkdir(queryPath, (err) => {
    if (err) {
        console.log(err)
        return res.status(500).send(err)
    }
    return res.status(201).send('OK')
  })
})

export default router