import express from 'express'
import checkDiskSpace from 'check-disk-space'

const router = express.Router()

router.get('/', async (req, res) => {
  checkDiskSpace(process.env.ROOT_DIRECTORY_PATH)
    .then((diskSpace) => {
      console.log(diskSpace)
      res.status(200).send(diskSpace)
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send(err)
    })
})

export default router