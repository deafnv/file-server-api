---
label: Introduction 
icon: home
order: 0
---

# File Server

Basic file server with API routes for CRUD.

Authorization for a single admin api key/password, giving permissions for state-changing interactions like creating new folders, or uploading files. Unauthorized users will still be a able to view and download the files. [Authorization Routes](/authorization)

All file paths used in requests are relative to `root` path in `config.yaml`, i.e., `/server/files/image.jpg` not `/home/deafnv/server/files/image.jpg`.

This file server is used in the demo in [this repository](https://github.com/deafnv/file-server-web).

### Usage

Clone, setup `config.yaml`, and run `npm install`, `npm run build`, and `npm start`. See [`config-template.yaml`](/config) for details on the config file format. The server should start by default on port 80, and 443 if configured with HTTPS.

!!!
If database is enabled and running for the first time, run `npm run migrate` to migrate the database schema.
!!!

### Routes

All routes causing state changes in the server require authorization. See [Authorization Routes](/authorization) for details.