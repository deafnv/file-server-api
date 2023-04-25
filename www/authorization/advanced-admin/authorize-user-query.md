---
label: Query users
order: 0
---

### Route Details

#### ```GET /authorize/user```

Searches for users matching a query string, or index all if none provided.

#### Request

- Method: `HTTP GET`

- Request query parameter `user` (optional): 

Search string to find users by username. Leave out to index entire database.

```
https://example.com/authorize/user?user=deafnv
```

#### Response

Array of matching users and their data.

``` json
[
  {
    "uid": "random-uid",
    "username": "deafnv",
    "rank": 0,
    "createdAt": 1682348075463
  }
]
```