---
label: List of Routes
icon: list-unordered
order: -3
---

# List of Routes

Query routes are unauthorized by default (changeable in `config.yaml`), and state-changing routes (create, update, delete) require authorization.

___
### Query routes

- [/list](/query/list): Lists the file in a given directory. Lists root directory if unspecified.
- [/retrieve](/query/retrieve): Retrieves file specified. Supports video streaming.
- [/filetree](/query/filetree): Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.
- [/search](/query/search): Searches for files/folders across the entire directory. (Only available if `indexing` config option is enabled)
- [/logs](/query/logs): Retrieves logs stored in the database. (Only available if both `database` and `logs` config option are enabled)

___
### State-changing routes

- [/upload](/state-changing/upload): Uploads files into directory provided.
- [/delete](/state-changing/delete): Deletes files specified.
- [/makedir](/state-changing/makedir): Creates a folder in directory specified.
- [/move](/state-changing/move): Moves files and/or folders into a given directory.
- [/copy](/state-changing/copy): Copy files and/or folders into a given directory.
- [/rename](/state-changing/rename): Renames a file specified.
- [/shortcut](/state-changing/shortcut): Creates a `*.shortcut.json` file containing target path data in current path. Not a symlink.
- [/metadata](/state-changing/metadata): Changes metadata for directories specified. (Only available if `metadata` config option is enabled)

___
### Authorization routes
- [/authorize/get](/authorization/authorize-get): Get JWT from body provided.
- [/authorize/logout](/authorization/authorize-logout): Delete any token cookie in request.

#### Advanced Auth

- [/authorize/login](/authorization/advanced/authorize-login): Advanced version of /authorize/get that doesn't allow API key logins for security. Get and send JWT from user data.
- [/authorize/register](/authorization/advanced/authorize-register): Get JWT from user data and registers the user.
- [/authorize/delete](/authorization/advanced/authorize-delete): Deletes user data from database, and removes token cookie from client.
- [/authorize/user](/authorization/advanced-admin/authorize-user-query): Searches for users matching a query string, or index all if none provided.
- [/authorize/{"username"}/modify](/authorization/advanced-admin/authorize-user-modify): Modify user data of username provide.