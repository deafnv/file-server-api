import express from 'express'
import { PROCESS_RUNNING, setStatus } from '../index.js'

const router = express.Router()

router.get('/', (req, res) => {
  if (!PROCESS_RUNNING) return res.status(200).send('No processes running')
  setStatus(false)
  return res.status(200).send('All processes ended')
})

export default router