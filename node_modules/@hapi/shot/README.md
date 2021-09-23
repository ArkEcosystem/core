<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# shot

Injects a fake HTTP request/response into a node HTTP server for simulating server logic, writing tests, or debugging. Does not use a socket
connection so can be run against an inactive server (server not in listen mode).

[![Build Status](https://secure.travis-ci.org/hapijs/shot.png)](http://travis-ci.org/hapijs/shot)

## Example

```javascript
const Http = require('http');
const Shot = require('@hapi/shot');


const internals = {};


internals.main = async function () {

    const dispatch = function (req, res) {

        const reply = 'Hello World';
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': reply.length });
        res.end(reply);
    };

    const server = Http.createServer(dispatch);

    const res = await Shot.inject(dispatch, { method: 'get', url: '/' });
    console.log(res.payload);
};


internals.main();
```

Note how `server.listen` is never called.

## API

See the [API Reference](API.md)
