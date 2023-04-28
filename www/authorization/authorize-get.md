---
label: /authorize/get
order: 0
---

### Route Details

#### ```POST /authorize/get```

Get and send JWT from body provided.

#### Request

- Method: `HTTP POST`

- Request body: `X-API-Key: api-key-provided-in-config.yaml` header. Any request body is used for generating JWT.

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. Contains `Set-Cookie` header with token.
401         | Unauthorized. Missing or wrong API key.
429         | Too Many Requests