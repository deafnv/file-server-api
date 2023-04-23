---
label: Miscellaneous
order: -2
---

### Listening to server updates

The server will broadcast websocket events upon successful execution of any of the [authorized state changing routes](/list-of-routes/#authorized-routes), with the event name being the relative path (relative to the `directory` path provided in `config.yaml`) of the directory affected by the update. 

For example, a delete request made on `/home/deafnv/server-files/dir-1` will broadcast a `/dir-1` event with payload `DELETE`. Client side re-polling of `/list` can be done by listening for these events.

Example implementation in Next.js:
``` tsx
socket.on('connect', () => {
  fetchData() //Fetch from /list
})

socket.on(`/${(router.query.path as string[])?.join('/') ?? ''}`, () => {
  fetchData() //Fetch from /list
})
```