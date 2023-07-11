---
label: /authorize/register
order: -1
---

### Route Details

#### ```POST /authorize/register```

Get JWT from user data and registers the user.

#### Request

- Method: `HTTP POST`

- Request body: 
  ``` json
  {
    "username": "deafnv", // String between 4-16 characters long
    "password": "verysecretpassword" // String between 6-255 characters long
  }
  ```

#### Response

| Status Code | Description                                               |
| ----------- | --------------------------------------------------------- |
| 200         | Success. Contains `Set-Cookie` header with token.         |
| 400         | Restricted username. Set in `config.yaml`.                |
| 404         | Not Found. Database setting is disabled in `config.yaml`. |
| 409         | Username has been taken.                                  |
| 429         | Too Many Requests                                         |