import express from 'express'
import cors from 'cors'
import http from 'http'
import * as dotenv from 'dotenv'

import list from './routes/list.js'
import retrieve from './routes/retrieve.js'
import makeDir from './routes/makedir.js'
import loadmkv from './routes/loadmkv.js'
import caption from './routes/caption.js'

dotenv.config()

const app = express()

/* app.use(
  cors({origin: ['http://localhost:3000', 'http://192.168.0.102:3000', 'http://127.0.0.1:3000']})
) */

app.use(express.json())

app.use('/list', list)
app.use('/retrieve', retrieve)
app.use('/makedir', makeDir)
app.use('/loadmkv', loadmkv)
app.use('/caption', caption)

app.get('/', (req, res) => {
  res.send('File server functional')
})

const httpServer = http.createServer(app)

httpServer.listen(80, () => {
  console.log('HTTP Server running on port 80');
})