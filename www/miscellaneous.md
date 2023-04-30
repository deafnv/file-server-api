---
label: Miscellaneous
icon: three-bars
order: -2
---

### Listening to server updates

The server will broadcast websocket events upon successful execution of any of the [state-changing routes](/list-of-routes/#state-changing-routes), with the event name being the relative path (relative to the `root` path provided in `config.yaml`) of the directory affected by the update. 

For example, a delete request made on `/home/deafnv/server-files/dir-1` will broadcast a `/dir-1` event with payload `DELETE`. Client side re-polling of `/list` can be done by listening for these events.

Example implementation in Next.js, with Typescript:
``` tsx
socket.on(`/${(router.query.path as string[])?.join('/') ?? ''}`, () => {
  fetchData() //Re-fetch data on any events received
})
```