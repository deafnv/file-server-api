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
    "password": "verysecretpassword" // String between 6-24 characters long
}
```

#### Response

Status code 200 with `Set-Cookie: token=` header containing token.