---
label: /copy
order: -4
---

### Route Details

#### ```POST /copy```

Copy files and/or folders into a given directory.

#### Request

- Method: `HTTP POST`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to copy.
```json
{
  "pathToFiles": [
    "/path/to/file1",
    "/path/to/file2"
  ],
  "newPath": "directory-to-copy-files-to"
}
```

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success. May contain error message if any files failed.
401         | Unauthorized. Requires API key or JWT with permission.
403         | Forbidden. User does not have permission.
429         | Too Many Requests
500         | Internal Server Error

**Example 200 partial success response body:**

``` json
{
  "message": "Some files failed",
  "failedFiles": [
    "file1", 
    "file2"
  ]
}
```