## 0.10.1
- Bump nock dependency to v9 as v8 has a dependency on a version of lodash with a security issue

## 0.10.0
- Add support for inner errors. Option `innerErrorFieldName` to specify a field or a function on the error object to use for retrieval of an inner error. Defaults to `cause` which is used in [VError](https://github.com/joyent/node-verror)

## 0.9.1

- Add an option to report column number for each frame of the stack trace

## 0.9.0

- Add capability to send custom data with Express handler
- Treat custom errors as Errors
- `useSSL` option now works correctly, and support added for HTTP proxies
- If network errors occur during payload posting, and a Node-style error callback param is available on the callback, this is now executed
- Functional sending tests now pass correctly

## 0.8.5

- Add ability to turn off 'humanised-object-strings'

## 0.8.4
- Add some smarts around passing an object in to the exception parameter

## 0.8.3
- Turn strings into errors if passed through. Log out request errors.

## 0.8.2
- Add setTags method

## 0.8.1
- Add custom error grouping key

## 0.8.0
- Add offline support

## 0.7.1
- Default useSSL to true

## 0.7.0
- Add onBeforeSend hook, api endpoint options, and bug fixes

## 0.6.2
- Fix utf8 chars causing 400s, log when errors occur when posting

## 0.6.1
- Replace deprecated request.host with request.hostname if it exists

## 0.6.0
- Added ability to send tags with exception reports

## 0.5.0
- Added filters for sensitive request data, and better affected user tracking

## 0.4.2
- Minor test refactor

## 0.4.1
- Fixed issue where getting cpu information returned undefined

## 0.4.0
- Added *user* function, deprecated setUser

## 0.3.0
- Added version and user tracking functionality; bump jshint version, update test

## 0.2.0
- Added Express handler, bug fixes

## 0.1.2
- Include more error information

## 0.1.1
- Point at the correct API endpoint, include correct dependencies for NPM

## 0.1.0
- Initial release
