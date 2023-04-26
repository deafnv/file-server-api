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

Varies depending on file requested. Specified by `Content-Type` header in the response.