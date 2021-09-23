# prepend-http [![Build Status](https://travis-ci.org/sindresorhus/prepend-http.svg?branch=master)](https://travis-ci.org/sindresorhus/prepend-http)

> Prepend `https://` to humanized URLs like `sindresorhus.com` and `localhost`


## Install

```
$ npm install prepend-http
```


## Usage

```js
const prependHttp = require('prepend-http');

prependHttp('sindresorhus.com');
//=> 'https://sindresorhus.com'

prependHttp('localhost', {https: false});
//=> 'http://localhost'

prependHttp('https://sindresorhus.com');
//=> 'https://sindresorhus.com'
```


## API

### prependHttp(url, [options])

#### url

Type: `string`

URL to prepend `https://` to.

#### options

Type: `object`

##### https

Type: `boolean`<br>
Default: `true`

Prepend `https://` instead of `http://`.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
