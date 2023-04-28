---
label: /filetree
order: -2
---

### Route Details

#### ```GET /filetree```

Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.

#### Request

- Method: `HTTP GET`

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | JSON representation of subdirectories.
401         | Unauthorized. Applies if route authorization enabled in `config.yaml`.
429         | Too Many Requests
500         | Internal Server Error   

**Example 200 response body:**

```json
{
  "dir-1": {},
  "dir-2": {
    "subdir-1": {
      "subsubdir-1": {}
    },
  },
  "dir-3": {}
}
```