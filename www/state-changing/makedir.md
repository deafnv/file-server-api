---
label: /makedir
order: -2
---

### Route Details

#### ```POST /makedir```

Creates a folder in directory specified.

#### Request

- Method: `HTTP POST`

- Request body: 
```json
{
  "newDirName": "new-directory",
  "currentPath": "directory-to-place-folder-in"
}
```

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
201         | Success
401         | Unauthorized. Requires API key or JWT with permission.
403         | Forbidden. User does not have permission.
429         | Too Many Requests
500         | Internal Server Error