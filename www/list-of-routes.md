---
label: List of Routes
order: -3
---

# List of Routes

### Non-authorized routes

- [/list](/unauthorized/list): Lists the file in a given directory. Lists root directory if unspecified.
- [/retrieve](/unauthorized/retrieve): Retrieves file specified. Supports video streaming.
- [/filetree](/unauthorized/filetree): Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.

___
### Authorized routes

- [/upload](/authorized/upload): Uploads files into directory provided.
- [/delete](/authorized/delete): Deletes files specified.
- [/makedir](/authorized/makedir): Creates a folder in directory specified.
- [/move](/authorized/move): Moves files and/or folders into a given directory.
- [/copy](/authorized/copy): Copy files and/or folders into a given directory.
- [/rename](/authorized/rename): Renames a file specified.

___
### Authorization routes
- [/authorize/get](/authorization/authorize-get): Get JWT from body provided.
- [/authorize/delete](/authorization/authorize-delete): Delete any token cookie in request.

#### Advanced Auth

- [/authorize/login](/authorization/advanced/authorize-login): Advanced version of /authorize/get that doesn't allow API key logins for security. Get and send JWT from user data.
- [/authorize/register](/authorization/advanced/authorize-register): Get JWT from user data and registers the user.
- [/authorize/delete](/authorization/advanced/authorize-delete): Deletes user data from database, and removes token cookie from client.
- [/authorize/user](/authorization/advanced-admin/authorize-user-query): Searches for users matching a query string, or index all if none provided.
- [/authorize/"{username"/modify](/authorization/advanced-admin/authorize-user-modify): Modify user data of username provide.