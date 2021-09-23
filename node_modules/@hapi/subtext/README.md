<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# subtext

HTTP payload parser.

[![Build Status](https://secure.travis-ci.org/hapijs/subtext.svg?branch=master)](http://travis-ci.org/hapijs/subtext)

`subtext` parses the request body and returns it in a promise.

## Example

```javascript
const Http = require('http');
const Subtext = require('@hapi/subtext');

Http.createServer(async (request, response) => {

  const { payload, mime } = await Subtext.parse(request, null, { parse: true, output: 'data' });

  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end(`Payload contains: ${JSON.stringify(payload)}`);

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');

```

## API

See the [API Reference](API.md)
