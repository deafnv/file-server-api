---
label: /delete
order: -1
---

### Route Details

#### ```DELETE /delete```

Deletes files specified.

#### Request

- Method: `HTTP DELETE`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to delete.
  ```json
  {
    "pathToFiles": [
      "/path/to/file1",
      "/path/to/file2"
    ]
  }
  ```

#### Response

| Status Code | Description                                            |
| ----------- | ------------------------------------------------------ |
| 200         | Success                                                |
| 401         | Unauthorized. Requires API key or JWT with permission. |
| 403         | Forbidden. User does not have permission.              |
| 429         | Too Many Requests                                      |
| 500         | Internal Server Error                                  |