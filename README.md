# file-server-api

Basic file server with API routes for CRUD.

Authorization for a single admin api key/password, giving permissions for state-changing interactions like creating new folders, or uploading files. Unauthorized users will still be a able to view and download the files.

## Usage

Clone, create `.env` file with variables, run `npm install` and `npm start`. The server should start on port 80, and 443 if configured with HTTPS. See `.env.template` for details on the environment variable format.

## Routes

All routes causing state changes in the server require authorization by either a token cookie, or an API key. See [Authorization Routes](#authorization-routes) for details.

### List of Routes

#### Non-authorized routes

- [/list](#listdirectory_path): Lists the file in a given directory. Lists root directory if unspecified.
- [/retrieve](#retrievefile_path): Retrieves file specified. Supports video streaming.
- [/filetree](#filetree): Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.

#### Authorized routes

- [/upload](#uploaddirectory_path): Uploads files into directory provided.
- [/delete](#delete): Deletes files specified.
- [/makedir](#makedir): Creates a folder in directory specified.
- [/move](#move): Moves files and/or folders into a given directory.
- [/copy](#copy): Copy files and/or folders into a given directory.
- [/rename](#rename): Renames a file specified.
- [/authorize/get](#authorizeget): Get JWT from body provided.
- [/authorize/delete](#authorizedelete): Delete any token cookie in request.

## Route Details

### /list/{directory_path}

Lists the file in a given directory. Lists root directory if unspecified.

#### Request

- Method: `HTTP GET`

- Path parameter {directory_path}: `/path/to/directory`

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
___

### /retrieve/{file_path}

Retrieves file specified. Supports video streaming.

#### Request

- Method: `HTTP GET`

- Path parameter {file_path}: `/path/to/file`

#### Response

Varies depending on file requested. Specified by `Content-Type` header in the response.
___

### /filetree

Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.

#### Request

- Method: `HTTP GET`

#### Response

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
___

### /upload/{directory_path}

Uploads files into directory provided.

#### Request

- Method: `HTTP POST`

- Path parameter {directory_path}: `/path/to/directory`

- Request body: `Content-Type: multipart/form-data`

#### Response

Status code 200.
___

### /delete

Deletes files specified.

#### Request

- Method: `HTTP DELETE`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to delete.
```json
{
  "pathToFiles": [
    "/path/to/file1",
    "/path/to/file2"
  ]
}
```

#### Response

Status code 200.
___

### /makedir

Creates a folder in directory specified.

#### Request

- Method: `HTTP POST`

- Request body: 
```json
{
  "newDirName": "new-directory",
  "currentPath": "directory-to-place-folder-in"
}
```

#### Response

Status code 201.
___

### /move

Moves files and/or folders into a given directory.

#### Request

- Method: `HTTP POST`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to move.
```json
{
  "pathToFiles": [
    "/path/to/file1",
    "/path/to/file2"
  ],
  "newPath": "directory-to-place-files-in"
}
```

#### Response

Status code 200.
___

### /copy

Copy files and/or folders into a given directory.

#### Request

- Method: `HTTP POST`

- Request body: JSON object with `pathToFiles`, string array of any length with path of files to copy.
```json
{
  "pathToFiles": [
    "/path/to/file1",
    "/path/to/file2"
  ],
  "newPath": "directory-to-copy-files-to"
}
```

#### Response

Status code 200.
___

### /rename

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
___

## Authorization Routes

### /authorize/get

Get JWT from body provided.

#### Request

- Method: `HTTP POST`

- Request body: `X-API-Key: api-key-provided-in-.env` header. Any request body is used for generating JWT.

#### Response

Status code 200 with `Set-Cookie: token=` header containing token.
___

### /authorize/delete

Delete any `token` cookie in request.

#### Request

- Method: `HTTP GET`

#### Response

Status code 200 with `Set-Cookie` header to clear the token cookie.
