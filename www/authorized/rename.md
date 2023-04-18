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

Status code 200.