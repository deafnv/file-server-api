import express from 'express'
import cors from 'cors'
import http from 'http'
import https from 'https'
import fs from 'fs'
import * as dotenv from 'dotenv'
import requestIp from 'request-ip'
import cookieParser from 'cookie-parser'
import { encodeQueueItems } from './lib/encoder.js'

import list from './routes/list.js'
import retrieve from './routes/retrieve.js'
import makeDir from './routes/makedir.js'
import rename from './routes/rename.js'
import deleteFile from './routes/delete.js'
import caption from './routes/caption.js'
import manifest from './routes/manifest.js'
import diskSpace from './routes/diskspace.js'
import convertcc from './routes/convertcc.js'
import encodeQueue from './routes/encodequeue.js'
import upload from './routes/upload.js'
import authorize from './routes/authorize.js'
import filetree from './routes/filetree.js'
 
dotenv.config()

const app = express()
app.disable('x-powered-by')
app.use(
  cors({
    origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003', 'https://cytu.be'].concat(process.env.CORS_URL.split(',')),
    credentials: true
  })
)

app.use(express.json())
app.use(requestIp.mw())
app.use(cookieParser())

app.use('/list', list)
app.use('/makedir', makeDir)
app.use('/rename', rename)
app.use('/delete', deleteFile)
app.use('/caption', caption)
app.use('/manifest', manifest)
app.use('/retrieve', retrieve)
app.use('/diskspace', diskSpace)
app.use('/convertcc', convertcc)
app.use('/encodequeue', encodeQueue)
app.use('/upload', upload)
app.use('/authorize', authorize)
app.use('/filetree', filetree)

app.get('/', (req, res) => {
  res.send('File server functional')
})

const httpServer = http.createServer(app)

httpServer.listen(80, () => {
  console.log('HTTP Server running on port 80');
})

const privateKey = fs.readFileSync('C:/Users/Okiniri/Desktop/Site Certs/rokiniri-key.pem', 'utf8');
const certificate = fs.readFileSync('C:/Users/Okiniri/Desktop/Site Certs/rokiniri-cert.pem', 'utf8');
const ca = fs.readFileSync('C:/Users/Okiniri/Desktop/Site Certs/rokiniri-chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
  ca: ca
}

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443')
})

setInterval(encodeQueueItems, 5000)