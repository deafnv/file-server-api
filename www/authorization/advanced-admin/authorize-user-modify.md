---
label: Modify user data
order: -1
---

### Route Details

#### ```PATCH /authorize/user/{"username"}/modify```

Modify user data of username provide.

#### Request

- Method: `HTTP PATCH`

- Path parameter \{username\}: Exact username to modify data of

- Request body: JSON containing fields to update. Cannot contain fields for password, username, createdAt, or _id. Permissions will overwrite existing, so the entire permissions object should be provided including the existing data.

``` json
{
  "rank": 50,
  "permissions": {
    "makedir": true,
    "upload": false,
    "rename": true,
    "copy": true,
    "move": true,
    "delete": true
  }
}
```

#### Response

Status code 200.