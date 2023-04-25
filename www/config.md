---
label: Configuration
order: -1
---

### Config File Setup

Make a copy of `config-template.yaml` and rename it `config.yaml`, then populate it as you see fit.

### Template

``` yaml
# Root directory of the files you want to serve
directory: '/home/deafnv/example'

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

# Use these to enable and disable certain routes
routes:
  makedir: true
  upload: true
  rename: true
  copy: true
  move: true
  delete: true

# Database to store user data, also enabling registration and permissions
database:
  enabled: false
  connection-string: 'mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]'
  # Usernames that cannot be used for registration
  restricted-usernames: ['admin']
  # Rank value, above which a user will be considered an admin of the server
  # Admins access to user data and unlimited permissions, but higher ranks are possible
  admin-rank: 99
```