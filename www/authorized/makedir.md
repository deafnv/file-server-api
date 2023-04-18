---
label: /makedir
order: -2
---

## Route Details

### /makedir

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

Status code 201.