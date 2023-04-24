import express from 'express'
import cors from 'cors'
import http from 'http'
import https from 'https'
import fs from 'fs'
import requestIp from 'request-ip'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'

import registerTestHandlers from './routes/socket/test.js'

import list from './routes/list.js'
import retrieve from './routes/retrieve.js'
import makeDir from './routes/makedir.js'
import rename from './routes/rename.js'
import deleteFile from './routes/delete.js'
import moveFile from './routes/move.js'
import copyFile from './routes/copy.js'
import diskSpace from './routes/diskspace.js'
import upload from './routes/upload.js'
import authorize from './routes/authorize.js'
import filetree from './routes/filetree.js'
import YAML from 'yamljs'
 
export const { 
	directory: rootDirectoryPath, 
	server:{
		domain: fileServerDomain,
		http: httpSettings, 
		https: httpsSettings, 
		'api-key': fsApiKeys, 
		'cors-allowed-origins': corsAllowedOrigins, 
		secret: jwtSecret,
		'socket-io-password': socketIOPassword
	},
	routes: {
		makedir: makedirRouteEnabled,
		upload: uploadRouteEnabled,
		rename: renameRouteEnabled,
		copy: copyRouteEnabled,
		move: moveRouteEnabled,
		delete: deleteRouteEnabled,
	}
} = YAML.load('config.yaml')

const app = express()
app.disable('x-powered-by')
app.use(
  cors({
    origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003', 'https://cytu.be'].concat(corsAllowedOrigins),
    credentials: true
  })
)

app.use(express.json())
app.use(requestIp.mw())
app.use(cookieParser())

app.use('/list', list)
app.use('/retrieve', retrieve)
app.use('/diskspace', diskSpace)
app.use('/filetree', filetree)

if (makedirRouteEnabled) app.use('/makedir', makeDir)
if (uploadRouteEnabled) app.use('/upload', upload)
if (renameRouteEnabled) app.use('/rename', rename)
if (copyRouteEnabled) app.use('/copy', copyFile)
if (moveRouteEnabled) app.use('/move', moveFile)
if (deleteRouteEnabled) app.use('/delete', deleteFile)

app.use('/authorize', authorize)

app.get('/', (req, res) => {
  res.send('File server functional')
})

const httpServer = http.createServer(app)
let httpsServer

if (httpsSettings.enabled) {
	const privateKey = fs.readFileSync(httpsSettings['private-key'], 'utf8');
	const certificate = fs.readFileSync(httpsSettings.certfile, 'utf8');
	const ca = fs.readFileSync(httpsSettings.ca, 'utf8');
	
	const credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca
	}

	httpsServer = https.createServer(credentials, app)
}

export const io = new Server(httpsSettings.enabled ? httpsServer : httpServer, {
	cors: {
		origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003'].concat(corsAllowedOrigins),
	}
})

io.on("connection", (socket) => {
  registerTestHandlers(io, socket)
})

httpServer.listen(httpSettings.port, () => {
  console.log(`HTTP Server running on port ${httpSettings.port}`)
})

if (httpsSettings.enabled) {
	httpsServer.listen(httpsSettings.port, () => {
		console.log(`HTTPS Server running on port ${httpsSettings.port}`)
	})
}