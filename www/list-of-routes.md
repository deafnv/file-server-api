# List of Routes

### Non-authorized routes

- [/list](/unauthorized/list): Lists the file in a given directory. Lists root directory if unspecified.
- [/retrieve](/unauthorized/retrieve): Retrieves file specified. Supports video streaming.
- [/filetree](/unauthorized/filetree): Returns a JSON representation of any subdirectories. Only lists directories, files are omitted.

### Authorized routes

- [/upload](/authorized/upload): Uploads files into directory provided.
- [/delete](/authorized/delete): Deletes files specified.
- [/makedir](/authorized/makedir): Creates a folder in directory specified.
- [/move](/authorized/move): Moves files and/or folders into a given directory.
- [/copy](/authorized/copy): Copy files and/or folders into a given directory.
- [/rename](/authorized/rename): Renames a file specified.

### Authorization routes
- [/authorize/get](/authorization/authorize-get): Get JWT from body provided.
- [/authorize/delete](/authorization/authorize-delete): Delete any token cookie in request.
