---
label: /retrieve
order: -1
---

### Route Details

#### ```GET /retrieve/{"file_path"}```

Retrieves file specified. Supports video streaming.

#### Request

- Method: `HTTP GET`

- Path parameter \{file_path\}: `/path/to/file`

- Query parameter: optional `download=true` can be used to directly download the file specified.

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Varies depending on file requested. Specified by `Content-Type` header.
401         | Unauthorized. Applies to authorized files based on `config.yaml`.
404         | Invalid path, file/directory not found
429         | Too Many Requests
500         | Internal Server Error  