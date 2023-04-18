---
label: /delete
order: -1
---

## Route Details

### /delete

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

Status code 200.