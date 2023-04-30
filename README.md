# file-server-api

Basic file server with API routes for CRUD.

Authorization for either simple admin api keys/passwords (giving unlimited permissions for state-changing interactions like creating new folders, or uploading files), or more complex account setups with individual ranks and permissions with user data stored in MongoDB. Unauthorized users will still be a able to view and download the files.

All file paths used in requests are relative to `root` path in `config.yaml`, i.e., `/server/files/image.jpg` not `/home/deafnv/server/files/image.jpg`.

This file server is used in the demo in [this repository](https://github.com/deafnv/file-server-web).

### Usage

Clone, setup `config.yaml`, run `npm install`, `npm run build`, and `npm start`. See [`config-template.yaml`](https://deafnv.github.io/file-server-api/config) for details on the config file format. The server should start by default on port 80, and 443 if configured with HTTPS.

**If database is enabled and running for the first time, run `npm run migrate` to migrate the database schema.**

### Routes

All routes causing state changes in the server require authorization. See [Authorization Routes](https://deafnv.github.io/file-server-api/authorization) for details.

### [Documentation](https://deafnv.github.io/file-server-api)