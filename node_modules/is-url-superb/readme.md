# is-url-superb [![Build Status](https://travis-ci.org/sindresorhus/is-url-superb.svg?branch=master)](https://travis-ci.org/sindresorhus/is-url-superb)

> Check if a string is a URL

Created because the [`is-url`](https://github.com/segmentio/is-url) module is too loose. This module depends on a much more comprehensive [regex](https://github.com/kevva/url-regex).


## Install

```
$ npm install is-url-superb
```


## Usage

```js
const isUrl = require('is-url-superb');

isUrl('https://sindresorhus.com');
//=> true

isUrl('//sindresorhus.com');
//=> true

isUrl('unicorn');
//=> false
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
