---
label: /move
order: -3
---

## Route Details

### /move

Moves files and/or folders into a given directory.

#### Request

- Method: `HTTP POST`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to move.
```json
{
  "pathToFiles": [
    "/path/to/file1",
    "/path/to/file2"
  ],
  "newPath": "directory-to-place-files-in"
}
```

#### Response

Status code 200.