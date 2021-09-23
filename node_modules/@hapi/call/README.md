<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# call

Simple HTTP Router

[![Build Status](https://secure.travis-ci.org/hapijs/call.png)](http://travis-ci.org/hapijs/call)

## Introduction

`call` is a simple node.js HTTP Router. It is used by popular [hapi.js](https://github.com/hapijs/hapi) web framework. It implements predictable and easy to use routing. Even if it is designed to work with Hapi.js, you can still use it as an independent router in your app.

## Example

```js
const Call = require('@hapi/call');

// Create new router
const router = new Call.Router();

// Add route
router.add({ method: 'get', path: '/' }, { label: 'root-path' });

// Add another route
router.add({ method: 'post', path: '/users' }, 'route specific data');

// Add another route with dynamic path
router.add({ method: 'put', path: '/users/{userId}' }, () => { /* ...handler... */ });

// Match route
router.route('post', '/users');
/* If matching route is found, it returns an object containing
    {
        params: {},                     // All dynamic path parameters as key/value
        paramsArray: [],                // All dynamic path parameter values in order
        route: 'route specific data';   // routeData
    }
*/


// Match route
router.route('put', '/users/1234');
/* returns
    {
        params: { userId: '1234' },
        paramsArray: [ '1234' ],
        route: [Function]
    }
*/
```

## API

See the detailed [API Reference](./API.md).
