---
label: .env Template
order: -1
---

### Template

```
ROOT_DIRECTORY_PATH=/path/to/files/to/serve/on/server

SITE_URL=domain for this server
CORS_URL=sites to allow for cors, separated by comma (example: https://sitea.com,https://siteb.com)

API_KEY=api key (will function as password for now)

JWT_SECRET=jwt secret (see: https://jwt.io/introduction)

SOCKET_ADMIN_PASSWORD=socket.io admin ui password (see: https://socket.io/docs/v4/admin-ui/)

PRIVATE_KEY=/route/to/privkey/key.pem
CERTIFICATE=/route/to/cert/cert.pem
CA=/route/to/ca/chain.pem

HTTP_PORT=HTTP port number
HTTPS_PORT=HTTPS port number
```