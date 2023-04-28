---
label: /authorize/logout
order: -1
---

### Route Details

#### ```GET /authorize/logout```

Delete any `token` cookie in request, logging out the client.

#### Request

- Method: `HTTP GET`

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. Contains `Set-Cookie` header to clear the token cookie.
429         | Too Many Requests