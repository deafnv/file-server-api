# Authorization

Authorization can be done in two ways:

- **Simple**: API keys provided in `config.yaml`, which gives unlimited permission when used as a request header `X-API-Key`. JSON web tokens (JWT) can be generated with [/authorize/get](/authorization/authorize-get), returning a response with a `Set-Cookie` header containing the token, and can be sent to validate authorized requests.

- **Complex**: More complex user accounts with ranks and permissions, allowing server admins to assign specific permissions to each user. User data is stored in MongoDB. This form of authorization can be enabled in `config.yaml` with the `database` option. The connection string must also be provided to allow for access to the database.

Advanced auth is disabled by default in `config.yaml`.

___
### Advanced Auth

User JWTs have the following body:

``` json
{
  "uid": "random-uid",
  "username": "deafnv",
  "rank": 0
}
```

The default rank upon registration is set at 0. 

Admin rank is specified in `config.yaml`, equal or above which users are considered admins. Admins have unlimited access to state-changing server interactions, and can see/modify user permissions.
