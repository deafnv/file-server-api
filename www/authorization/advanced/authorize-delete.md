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

Status code 200 with `Set-Cookie` header to clear the token cookie.