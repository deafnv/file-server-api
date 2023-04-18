# Authorization

These routes are intended for basic authorization to allow access to the authorized routes on the server. As of now, only one password/API key defined in `.env` is supported, and functions as an API key used directly in the header as `X-API-Key`. Using these authorization routes, a cookie can be obtained which will allow subsequent access without the key, as shown in the demo.