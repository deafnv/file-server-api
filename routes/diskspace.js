import express from 'express'
import checkDiskSpace from 'check-disk-space'
import omit from 'lodash/omit.js'

const router = express.Router()

router.get('/', async (req, res) => {
  checkDiskSpace(process.env.ROOT_DIRECTORY_PATH)
    .then((diskSpace) => {
      res.status(200).send(omit(diskSpace, 'diskPath'))
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send(err)
    })
})

export default router