---
label: /list
order: 0
---

### Route Details

#### ```GET /list/{"directory_path"}```

Lists the file in a given directory. Lists root directory if unspecified.

#### Request

- Method: `HTTP GET`

- Path parameter \{directory_path\}: `/path/to/directory`

#### Response

Array of variable length, with JSON object for each item in directory. Size in bytes.

```json
{
  "name": "file_or_folder_name",
  "size": 0,
  "created": "1970-01-01T00:00:00Z",
  "modified": "1970-01-01T00:00:01Z",
  "isDirectory": true
}
```