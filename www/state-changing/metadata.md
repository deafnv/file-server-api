---
label: /metadata
order: -7
---

### Route Details

#### ```POST /metadata```

Changes metadata for files/folders specified.

!!!
Only available if both `database.enabled` and `database.features.metadata.enabled` options are set to true in `config.yaml`.
!!!

#### Request

- Method: `HTTP POST`

- Request body: 

  - Only `description` and `color` are considered valid metadata.

    ```json
    {
      "pathToFiles": ["/[TESTING_ONLY]"], // Path of files to modify metadata of
      "newMetadata": {
        "description": "Some description",
        "color": "#FFFFFF"
      }
    }
    ```

#### Response

| Status Code | Description                                            |
| ----------- | ------------------------------------------------------ |
| 200         | Success.                                               |
| 401         | Unauthorized. Requires API key or JWT with permission. |
| 404         | Directory not found.                                   |
| 429         | Too Many Requests                                      |
| 500         | Internal Server Error                                  |