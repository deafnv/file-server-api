import fs from 'fs'

import YAML from 'yaml'

if (!fs.existsSync('./config.yaml')) throw new Error('No config.yaml file found.')

const configFile = await fs.promises.readFile('./config.yaml', 'utf8')
export var {
  directory: { root: rootDirectoryPath, exclude: excludedDirs, protected: protectedPaths },
  server: {
    domain: fileServerDomain,
    http: httpSettings,
    https: httpsSettings,
    'api-key': fsApiKeys,
    'cors-allowed-origins': corsAllowedOrigins,
    secret: jwtSecret,
  },
  'rate-limiter': { enabled: limiterEnabled, window: limiterWindow, max: limiterMax },
  routes: {
    makedir: makedirRouteEnabled = true,
    upload: uploadRouteEnabled = true,
    rename: renameRouteEnabled = true,
    copy: copyRouteEnabled = true,
    move: moveRouteEnabled = true,
    delete: deleteRouteEnabled = true,
    shortcut: shortcutRouteEnabled = true,
  },
  'route-authorization': {
    list: isListRequireAuth = false,
    filetree: isFiletreeRequireAuth = false,
    retrieve: isRetrieveRequireAuth = false,
    logs: isLogsRequireAuth = false,
  },
  metadata: metadataEnabled = false,
  indexing: { enabled: indexingEnabled = true, 'indexing-interval': indexingInterval = 3600 },
  database: {
    enabled: dbEnabled = false,
    features: {
      users: {
        enabled: dbUsersEnabled = false,
        'restricted-usernames': restrictedUsernames = ['admin'],
        'admin-rank': adminRank = 99,
      },
      logs: { enabled: dbLogsEnabled = true },
    },
  },
}: Config = YAML.parse(configFile)
//TODO: Validate config file keys

interface Config {
  directory: {
    root: string
    exclude: string[]
    protected: string[]
  }
  server: {
    domain: string
    http: { port: number }
    https: {
      enabled: boolean
      port: number
      'private-key': string
      certfile: string
      ca: string
    }
    'api-key': string[]
    'cors-allowed-origins': string[]
    secret: string
  }
  'rate-limiter': {
    enabled: boolean
    window: number
    max: number
  }
  routes: {
    makedir: boolean
    upload: boolean
    rename: boolean
    copy: boolean
    move: boolean
    delete: boolean
    shortcut: boolean
  }
  'route-authorization': {
    list: boolean | number
    filetree: boolean | number
    retrieve: boolean | number
    logs: boolean | number
  }
  metadata: boolean
  indexing: {
    enabled: boolean
    'indexing-interval': number
  }
  database: {
    enabled: boolean
    features: {
      users: {
        enabled: boolean
        'restricted-usernames': string[]
        'admin-rank': number
      }
      logs: {
        enabled: boolean
      }
    }
  }
}
