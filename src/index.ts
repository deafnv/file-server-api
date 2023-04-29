import http from 'http'
import https from 'https'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

import express from 'express'
import requestIp from 'request-ip'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import { Db, MongoClient, ServerApiVersion } from 'mongodb'
import YAML from 'yaml'

import list from './routes/query/list.js'
import fileTree from './routes/query/filetree.js'
import diskSpace from './routes/query/diskspace.js'

const configFile = await fs.promises.readFile('./config.yaml', 'utf8')
export var { 
	directory: {
		root: rootDirectoryPath,
		exclude: excludedDirs,
		protected: protectedPaths
	},
	server:{
		domain: fileServerDomain,
		http: httpSettings, 
		https: httpsSettings, 
		'api-key': fsApiKeys, 
		'cors-allowed-origins': corsAllowedOrigins, 
		secret: jwtSecret
	},
	['rate-limiter']: {
		enabled: limiterEnabled,
		window: limiterWindow,
		max: limiterMax
	},
	routes: {
		makedir: makedirRouteEnabled,
		upload: uploadRouteEnabled,
		rename: renameRouteEnabled,
		copy: copyRouteEnabled,
		move: moveRouteEnabled,
		delete: deleteRouteEnabled
	},
	['route-authorization']: {
		list: isListRequireAuth,
		filetree: isFiletreeRequireAuth,
		retrieve: isRetrieveRequireAuth
	},
	database: {
		enabled: dbEnabled,
		'connection-string': connectionString,
		'restricted-usernames': restrictedUsernames,
		'admin-rank': adminRank
	}
} = YAML.parse(configFile)

export var excludedDirsAbsolute = excludedDirs.map((dir: string) => path.join(rootDirectoryPath, dir))
export var protectedPathsAbsolute = protectedPaths.map((dir: string) => path.join(rootDirectoryPath, dir))

export let db: Db
if (dbEnabled) {
	const client = new MongoClient(connectionString, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		}
	})
	
	try {
		await client.connect()
		await client.db('admin').command({ ping: 1 })
		console.log('Connected to database')
		db = client.db('file-server')
	} catch (err) {
		console.error(err)
	}
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

app.get('/', (req, res) => res.send('File server functional'))

//* For checking database enabled setting
app.get('/isdb' , (req, res) => res.send(dbEnabled))

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

io.on("connection", (socket) => {
  console.log('Someone connected')
})

httpServer.listen(3100, () => {
  console.log(`HTTP Server running on port 3100`)
})

if (httpsSettings.enabled && httpsServer) {
	httpsServer.listen(httpsSettings.port, () => {
		console.log(`HTTPS Server running on port ${httpsSettings.port}`)
	})
}