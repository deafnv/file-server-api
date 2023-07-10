---
label: /logs
order: -4
---

### Route Details

#### ```GET /logs```

Retrieves all logs stored in the database, filtered according to the query parameters provided and ordered by latest first.

!!!
Only available if both `database.enabled` and `database.features.logs.enabled` options is set to true in `config.yaml`.
!!!

#### Request

- Method: `HTTP GET`

- Query parameters, allows filtering by parameters provided (at least one or more): 
  - `path`: Get logs of a file/directory (prioritized over `inpath`)
  - `inpath`: Get logs within a directory
  - `type`: Get logs of a certain event type, see [list](#list-of-event-types).
  - `user`: Get logs of events made by a user

#### Response

| Status Code | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| 200         | Array of variable length, with JSON object for each log entry.                 |
| 401         | Unauthorized. Applies if `/list` route authorization enabled in `config.yaml`. |
| 429         | Too Many Requests                                                              |
| 500         | Internal Server Error                                                          |


**Example 200 response body:**

``` json
[
  {
    "log_id": 1,
    "username": null,
    "display_name": "deafnv",
    "ip_address": "111.111.11.111",
    "file_id": "1688849860271907",
    "event_type": "RETRIEVE",
    "event_path": "/testdir/test.jpg",
    "event_old": null,
    "event_new": null,
    "event_data": null,
    "created_at": "2023-07-09T11:36:11.948Z"
  }
]
```

___

#### List of event types

##### File events

| Route Name                          | Event Type |
| ----------------------------------- | ---------- |
| [/retrieve](/query/retrieve)        | RETRIEVE   |
| [/upload](/state-changing/upload)   | UPLOAD     |
| [/delete](/state-changing/delete)   | DELETE     |
| [/copy](/state-changing/copy)       | COPY       |
| [/move](/state-changing/move)       | MOVE       |
| [/rename](/state-changing/rename)   | RENAME     |
| [/makedir](/state-changing/makedir) | MAKEDIR    |

##### Authorization events

| Route Name                                                        | Event Type |
| ----------------------------------------------------------------- | ---------- |
| [/authorize/register](/authorization/advanced/authorize-register) | REGISTER   |
| [/authorize/login](/authorization/advanced/authorize-login)       | LOGIN      |
| [/authorize/delete](/authorization/advanced/authorize-delete)     | DELETEUSER |
| [/authorize/get](/authorization/authorize-get)                    | APILOGIN   |
| [/authorize/logout](/authorization/authorize-logout)              | LOGOUT     |
| /authorize/verify                                                 | VERIFY     |