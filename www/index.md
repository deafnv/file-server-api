---
label: File Server
order: 0
---

# File Server

Basic file server with API routes for CRUD.

Authorization for a single admin api key/password, giving permissions for state-changing interactions like creating new folders, or uploading files. Unauthorized users will still be a able to view and download the files.

All file paths used in requests are relative to `ROOT_DIRECTORY_PATH`, i.e., `/server/files/image.jpg` not `/home/deafnv/server/files/image.jpg`.

This file server is used in the demo in [this repository](https://github.com/deafnv/file-server-web).

### Usage

Clone, create `.env` file with variables, run `npm install` and `npm start`. The server should start on port 80, and 443 if configured with HTTPS. See [`.env.template`](/env-template) for details on the environment variable format.

### Routes

All routes causing state changes in the server require authorization by either a token cookie, or an API key. See [Authorization Routes](/authorization) for details.