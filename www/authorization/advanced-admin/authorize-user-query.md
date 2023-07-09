---
label: Query users
order: 0
---

### Route Details

#### ```GET /authorize/user```

Searches for users matching a query string, or index all if none provided.

#### Request

- Method: `HTTP GET`

- Query parameters:
  - `user` (optional): Search string to find users by username. Leave out to index entire database.

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. Array of matching users and their data.
401         | Unauthorized. Requires API key or JWT cookie.
403         | Forbidden. User does not have permission.
404         | Not Found. Database setting is disabled in `config.yaml`.
429         | Too Many Requests
500         | Internal Server Error

**Example 200 response body:**

``` json
[
  {
    "username": "deafnv",
    "rank": 0,
    "permissions": {
      "makedir": false,
      "upload": false,
      "rename": false,
      "copy": false,
      "move": false,
      "delete": false,
    },
    "createdAt": 1682348075463
  }
]
```