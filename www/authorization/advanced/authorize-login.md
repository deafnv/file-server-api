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

Status code 200 with `Set-Cookie: token=` header containing token.