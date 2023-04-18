---
label: /copy
order: -4
---

## Route Details

### /copy

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

Status code 200.