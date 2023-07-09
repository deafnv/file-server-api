---
label: Configuration
icon: gear
order: -1
---

### Config File Setup

Make a copy of `config-template.yaml` and rename it `config.yaml`, then populate it as you see fit.

!!!
If database is enabled and running for the first time, run `npm run migrate` to migrate the database schema.
!!!

### Template

``` yaml
ddirectory:
  # Root directory of the files to be served
  root: '/app/data'
  # Files/directories to exclude when querying with /list or /retrieve, relative to root, matches glob patterns
  exclude: 
    - '**/.metadata.json' # Exclude server-generated metadata files
  # Require admin authorization for query requests on these routes, relative to root, matches glob patterns
  protected:
    - '/events-log.log' # Log of all server events
    - '/secret.jpg'
    - '/secret-dir'
    - '/secret-dir/**/*'

server:
  # Domain file server is hosted on
  domain: https://example.com
  # HTTP server settings
  http:
    port: 80
  # HTTPS server settings
  https:
    enabled: false
    port: 443
    private-key: '/route/to/privkey/key.pem'
    certfile: '/route/to/cert/cert.pem'
    ca: '/route/to/ca/chain.pem'
  # API keys that function as admin passwords, in an array
  api-key: ['secretAPIKey']
  # Domains of sites to allow for CORS
  cors-allowed-origins: [https://sitea.com, https://siteb.com]
  # JWT secret for cookies (see: https://jwt.io/introduction)
  secret: 'change-me'

# Rate limiter settings (default: 5 requests per second)
rate-limiter:
  enabled: true
  window: 1000
  max: 5

# Use these to enable and disable certain routes
routes:
  makedir: true
  upload: true
  rename: true
  copy: true
  move: true
  delete: true
  shortcut: true

# Controls which routes require authorization. Setting to false disables the need for users to authorize. Can also be set to an integer to specify minimum rank allowed.
route-authorization:
  list: false
  filetree: false
  retrieve: false

# Creates metadata files in each directory, setting to false deletes all existing metadata files
metadata: false

# Indexes files for searching
indexing:
  enabled: false
  indexing-interval: 3600

# Sqlite database to store users data or logs
database:
  enabled: true
  features:
    users:
      # Stores user data, also enabling registration and permissions
      enabled: false
      # Usernames that cannot be used for registration
      restricted-usernames: ['admin']
      # Rank value, above which a user will be considered an admin of the server
      # Admins have access to user data and unlimited permissions, but higher ranks are possible
      admin-rank: 99
    logs:
      # Stores detailed logs on server interactions
      enabled: true
```