---
label: /upload
order: 0
---

### Route Details

#### ```POST /upload/{"directory_path"}```

Uploads a file into directory provided.

#### Request

- Method: `HTTP POST`

- Path parameter \{directory_path\}: `/path/to/directory`

- Request body: `Content-Type: multipart/form-data`

#### Response

| Status Code | Description                                            |
| ----------- | ------------------------------------------------------ |
| 200         | Success                                                |
| 401         | Unauthorized. Requires API key or JWT with permission. |
| 403         | Forbidden. User does not have permission.              |
| 429         | Too Many Requests                                      |
| 500         | Internal Server Error                                  |