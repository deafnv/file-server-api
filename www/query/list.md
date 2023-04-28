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

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Array of variable length, with JSON object for each item in directory. Size in bytes.
401         | Unauthorized. Applies if route authorization enabled in `config.yaml`.
404         | Invalid path, directory not found
429         | Too Many Requests
500         | Internal Server Error                                                                                  


**Example 200 response body:**

```json
{
  "name": "file_or_folder_name",
  "size": 0,
  "created": "1970-01-01T00:00:00Z",
  "modified": "1970-01-01T00:00:01Z",
  "isDirectory": true
}
```