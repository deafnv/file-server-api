import http from 'http'
import https from 'https'
import cors from 'cors'
import fs from 'fs'

import express from 'express'
import requestIp from 'request-ip'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import { Prisma, PrismaClient } from '@prisma/client'

import list from './routes/query/list.js'
import fileTree from './routes/query/filetree.js'
import diskSpace from './routes/query/diskspace.js'
import retrieve from './routes/query/retrieve.js'
import upload from './routes/state-changing/upload.js'
import deleteFile from './routes/state-changing/delete.js'
import makeDir from './routes/state-changing/makedir.js'
import moveFile from './routes/state-changing/move.js'
import copyFile from './routes/state-changing/copy.js'
import rename from './routes/state-changing/rename.js'
import metadataHandler from './routes/state-changing/metadata.js'

import authorize from './routes/authorize.js'
import { initializeMetadata, deleteMetadata } from './lib/metadata-init.js'

import { 
	copyRouteEnabled, 
	corsAllowedOrigins, 
	dbEnabled, 
	deleteRouteEnabled, 
	httpSettings, 
	httpsSettings, 
	limiterEnabled, 
	limiterMax, 
	limiterWindow, 
	makedirRouteEnabled, 
	moveRouteEnabled, 
	renameRouteEnabled, 
	uploadRouteEnabled,
	metadataEnabled 
} from './lib/config.js'

export let prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation>
if (dbEnabled) {
	prisma = new PrismaClient()
}

const limiter = rateLimit({
	windowMs: limiterWindow,
	max: limiterMax,
	standardHeaders: true,
	legacyHeaders: false,
})

const app = express()
app.disable('x-powered-by')
app.use(
  cors({
    origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003', 'https://cytu.be'].concat(corsAllowedOrigins),
    credentials: true
  })
)

if (limiterEnabled) app.use(limiter)

app.use(express.json())
app.use(requestIp.mw())
app.use(cookieParser())

app.use('/list', list)
app.use('/filetree', fileTree)
app.use('/diskspace', diskSpace)
app.use('/retrieve', retrieve)

if (uploadRouteEnabled) app.use('/upload', upload)
if (deleteRouteEnabled) app.use('/delete', deleteFile)
if (makedirRouteEnabled) app.use('/makedir', makeDir)
if (moveRouteEnabled) app.use('/move', moveFile)
if (copyRouteEnabled) app.use('/copy', copyFile)
if (renameRouteEnabled) app.use('/rename', rename)

if (metadataEnabled) app.use('/metadata', metadataHandler)

app.use('/authorize', authorize)

app.get('/', (req, res) => res.send('File server functional'))

//* For checking enabled settings
app.get('/isdb' , (req, res) => res.send(dbEnabled))
app.get('/ismetadata' , (req, res) => res.send(metadataEnabled))

const httpServer = http.createServer(app)

let httpsServer: https.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined
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

export const io = new Server(httpServer, {
	cors: {
		origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003'].concat(corsAllowedOrigins),
	}
})

/* io.on("connection", (socket) => {
  console.log('Someone connected')
}) */

if (metadataEnabled) {
	console.log('Validating metadata files')
	await initializeMetadata()
} else {
	await deleteMetadata()
}

httpServer.listen(httpSettings.port, () => {
  console.log(`HTTP Server running on port ${httpSettings.port}`)
})

if (httpsSettings.enabled && httpsServer) {
	httpsServer.listen(httpsSettings.port, () => {
		console.log(`HTTPS Server running on port ${httpsSettings.port}`)
	})
}