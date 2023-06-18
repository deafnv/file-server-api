---
label: /metadata
order: -7
---

### Route Details

#### ```POST /metadata```

Changes metadata for directories specified.

!!!
Only available if `metadata` option is set to true in `config.yaml`.

The server will scan through all directories within the root directory and add a default `.metadata.json` file to each of them. Disabling the option will delete all metadata files and their contents will be reset if re-enabled.
!!!

#### Request

- Method: `HTTP POST`

- Request body: 
```json
{
  "directories": ["/[TESTING_ONLY]"], // Directories to modify
  "newMetadata": {
      "color": "#FFFFFF"
  }
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