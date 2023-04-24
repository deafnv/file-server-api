import express from 'express'
import checkDiskSpace from 'check-disk-space'
import omit from 'lodash/omit.js'
import fs from 'fs'

import { rootDirectoryPath } from '../index.js'

const router = express.Router()

router.get('/', async (req, res) => {
  checkDiskSpace(rootDirectoryPath)
    .then((diskSpace) => {
      const readCache = fs.existsSync('cache-diskspace.json') ? fs.readFileSync('cache-diskspace.json') : null
      const cachedDiskSpace = JSON.parse(readCache)

      //* Return cache if less than an 30 mins old
      if (cachedDiskSpace && cachedDiskSpace.cacheTime + 1_800_000 > Date.now()) {
        return res.status(200).send(omit(cachedDiskSpace, 'diskPath'))
      }

      Object.assign(diskSpace, { "cacheTime": Date.now() })
      fs.writeFileSync('cache-diskspace.json', JSON.stringify(diskSpace, 'diskPath'))
      return res.status(200).send(omit(diskSpace, 'diskPath'))
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send(err)
    })
})

export default router