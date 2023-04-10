import express from 'express'
import cors from 'cors'
import http from 'http'
import https from 'https'
import fs from 'fs'
import * as dotenv from 'dotenv'
import requestIp from 'request-ip'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'

import registerTestHandlers from './routes/socket/test.js'

import list from './routes/list.js'
import retrieve from './routes/retrieve.js'
import makeDir from './routes/makedir.js'
import rename from './routes/rename.js'
import deleteFile from './routes/delete.js'
import moveFile from './routes/move.js'
import diskSpace from './routes/diskspace.js'
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
app.use('/move', moveFile)
app.use('/retrieve', retrieve)
app.use('/diskspace', diskSpace)
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

const privateKey = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8');
const certificate = fs.readFileSync(process.env.CERTIFICATE, 'utf8');
const ca = fs.readFileSync(process.env.CA, 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
  ca: ca
}

const httpsServer = https.createServer(credentials, app)

export const io = new Server(httpsServer, {
	cors: {
		origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003'].concat(process.env.CORS_URL.split(',')),
	}
})

instrument(io, {
	auth: {
		type: 'basic',
		username: 'admin',
		password: process.env.SOCKET_ADMIN_PASSWORD
	}
})

io.on("connection", (socket) => {
  registerTestHandlers(io, socket)
})

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443')
})