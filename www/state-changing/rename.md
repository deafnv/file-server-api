---
label: /rename
order: -5
---

### Route Details

#### ```PATCH /rename```

Renames a file specified.

#### Request

- Method: `HTTP PATCH`

- Request body: 
  ```json
  {
    "pathToFile": "/path/to/file/to/rename/old-name",
    "newName": "new-name"
  }
  ```

#### Response

| Status Code | Description                                             |
| ----------- | ------------------------------------------------------- |
| 200         | Success. May contain error message if any files failed. |
| 401         | Unauthorized. Requires API key or JWT with permission.  |
| 403         | Forbidden. User does not have permission.               |
| 404         | File/directory not found.                               |
| 429         | Too Many Requests                                       |
| 500         | Internal Server Error                                   |