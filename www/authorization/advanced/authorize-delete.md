---
label: /authorize/delete
order: -2
---

### Route Details

#### ```DELETE /authorize/delete```

Deletes user data from database, and removes token cookie from client.

#### Request

- Method: `HTTP DELETE`

- Request body:

``` json
{
    "username": "deafnv", // String
    "password": "verysecretpassword" // String
}
```

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. Contains `Set-Cookie` header to clear the token cookie.
401         | Unauthorized. Wrong username or password.
404         | Not Found. Database setting is disabled in `config.yaml`.
429         | Too Many Requests
500         | Internal Server Error