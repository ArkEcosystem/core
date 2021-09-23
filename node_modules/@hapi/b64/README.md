<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# b64

Base64 streaming encoder and decoder

[![Build Status](https://secure.travis-ci.org/hapijs/b64.png)](http://travis-ci.org/hapijs/b64)

## Installation

```sh
npm install b64 --save
```


## API

### encode(buffer)

Base64 encode the buffer and return it as a new Buffer.


### decode(buffer)

Base64 decode the buffer and return the result as a new buffer.


### Encoder

Transform stream that base64 encodes each chunk of the stream.

Example:

```js
'use strict';

const Fs = require('fs');
const B64 = require('@hapi/b64');

const stream = Fs.createReadStream(`${__dirname}/package.json`);
const encoder = new B64.Encoder();

stream.pipe(encoder).pipe(process.stdout);
```


### Decoder

Transform stream that base64 decodes each chunk of the stream.

Example:

```js
'use strict';

const Fs = require('fs');
const B64 = require('@hapi/b64');

const stream = Fs.createReadStream(`${__dirname}/encodedfile.b64`);
const decoder = new B64.Decoder();

stream.pipe(decoder).pipe(process.stdout);
```

### base64urlEncode(value)

Encodes value of string or buffer type in Base64 or URL encoding, function will assert input value is correct.

### base64urlDecode(value)

Decodes string into Base64 or URL encoding, function throws an error on invalid input and returns a string or buffer depending on encoding provided.  Default encoding is binary.
