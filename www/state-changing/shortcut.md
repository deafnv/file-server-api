---
label: /shortcut
order: -6
---

### Route Details

#### ```POST /shortcut```

Creates a `*.shortcut.json` file containing target path data in current path. Not a symlink.

#### Request

- Method: `HTTP POST`

- Request body: 
```json
{
  "target": "/[TESTING_ONLY]/target-file.jpg",
  "currentPath": "/dir-1/dir-2"
}
```

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Success.
401         | Unauthorized. Requires API key or JWT with permission.
404         | Directory not found.
429         | Too Many Requests
500         | Internal Server Error

**Example \*.shortcut.json:**

Response body is an array containing objects of the following format:

```json
{
  "shortcutName": "file_or_folder_name Shortcut",
  "target": "/[TESTING_ONLY]/target-file.jpg",
  "targetData": {
    "name": "file_or_folder_name",
    "size": 695,
    "created": "1970-01-01T00:00:00Z",
    "modified": "1970-01-01T00:00:01Z",
    "isDirectory": false
  }
}
```