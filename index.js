import express from 'express'
import cors from 'cors'
import http from 'http'
import https from 'https'
import fs from 'fs'
import * as dotenv from 'dotenv'

import list from './routes/list.js'
import retrieve from './routes/retrieve.js'
import makeDir from './routes/makedir.js'
import loadmkv from './routes/loadmkv.js'
import caption from './routes/caption.js'
import manifest from './routes/manifest.js'
import diskSpace from './routes/diskspace.js'

dotenv.config()

const app = express()
app.disable('x-powered-by')
app.use(
  cors({origin: ['http://localhost:3003', 'http://192.168.0.102:3003', 'http://127.0.0.1:3003', 'https://cytu.be'].concat(process.env.CORS_URL.split(','))})
)

app.use(express.json())

app.use('/list', list)
app.use('/makedir', makeDir)
app.use('/loadmkv', loadmkv)
app.use('/caption', caption)
app.use('/manifest', manifest)
app.use('/retrieve', retrieve)
app.use('/diskspace', diskSpace)

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
	console.log('HTTPS Server running on port 443');
});