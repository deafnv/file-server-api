---
label: /search
order: -3
---

### Route Details

#### ```GET /search```

Searches for files/folders across the entire directory, returned in the same format as [/list](/query/list).

!!!
Only available if `indexing` option is set to true in `config.yaml`. 

The server will index all files on startup, and at an interval also specified in `config.yaml` (in seconds).
!!!

#### Request

- Method: `HTTP GET`

- Query parameters: 
  - q: Your search term, e.g., `https://example.com/search?q=cats`
  - filter: Optional filter, e.g., `directory`

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Array of variable length, with JSON object for each file matching the search term. Size in bytes.
401         | Unauthorized. Applies if `/list` route authorization enabled in `config.yaml`.
429         | Too Many Requests
500         | Internal Server Error                                                                                  


**Example 200 response body:**

Refer to the [response body for /list](/query/list#response).