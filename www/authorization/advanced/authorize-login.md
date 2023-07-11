---
label: /authorize/login
order: 0
---

### Route Details

#### ```POST /authorize/login```
 
Advanced version of [/authorize/get](/authorization/authorize-get) that doesn't allow API key logins for security. Get and send JWT from user data.

#### Request

- Method: `HTTP POST`

- Request body:
  ``` json
  {
    "username": "deafnv", // String
    "password": "verysecretpassword" // String
  }
  ```

#### Response

| Status Code | Description                                               |
| ----------- | --------------------------------------------------------- |
| 200         | Success. Contains `Set-Cookie` header with token.         |
| 401         | Unauthorized. Wrong username or password.                 |
| 404         | Not Found. Database setting is disabled in `config.yaml`. |
| 429         | Too Many Requests                                         |