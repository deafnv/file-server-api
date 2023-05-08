---
label: /retrieve
order: -1
---

### Route Details

#### ```GET /retrieve/{"file_path"}```

Retrieves file(s) specified. Retrieving a directory will archive the directories contents, and sends the archive.

#### Request

- Method: `HTTP GET`

- Path parameter \{file_path\}: `/path/to/file`

- Query parameters: 
  - Optional `download=true` can be used to directly download the file specified. 
  - Multiple files can be retrieved in an archive with multiple parameters of key `file[]` with the value of the file name. For example:
   `https://example.com/dir1/dir2?file[]=image1.png&file[]=image2.png&file[]=video1.mp4`

#### Response

Status Code | Description                                                                             
---         | ---                                                                                  
200         | Varies depending on file requested. Specified by `Content-Type` header.
401         | Unauthorized. Applies to authorized files based on `config.yaml`.
404         | Invalid path, file/directory not found
429         | Too Many Requests
500         | Internal Server Error  