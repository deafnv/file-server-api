---
label: /filetree
order: -2
---

## Route Details

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