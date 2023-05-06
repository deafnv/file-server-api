import fs from 'fs'
import path from 'path'

import YAML from 'yaml'

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
		'restricted-usernames': restrictedUsernames,
		'admin-rank': adminRank
	}
} = YAML.parse(configFile)

export var excludedDirsAbsolute = excludedDirs.map((dir: string) => path.join(rootDirectoryPath, dir))
export var protectedPathsAbsolute = protectedPaths.map((dir: string) => path.join(rootDirectoryPath, dir))