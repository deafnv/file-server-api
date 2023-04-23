---
label: /authorize/get
order: 0
---

### Route Details

#### ```POST /authorize/get```

Get JWT from body provided.

#### Request

- Method: `HTTP POST`

- Request body: `X-API-Key: api-key-provided-in-config.yaml` header. Any request body is used for generating JWT.

#### Response

Status code 200 with `Set-Cookie: token=` header containing token.