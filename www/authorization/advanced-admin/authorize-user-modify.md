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

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. Array of matching users and their data.
401         | Unauthorized. Requires API key or JWT cookie.
403         | Forbidden. User does not have permission. Applies when modifying a user of higher rank, or attempting to increase own rank.
404         | Not Found. Database setting is disabled in `config.yaml`, or user specified not found.
429         | Too Many Requests
500         | Internal Server Error