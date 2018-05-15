![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Winston Logger

## Installation

```bash
yarn add @arkecosystem/core-logger-winston
```

## Configuration

### Defaults

```js
const expandHomeDir = require('expand-home-dir')
const formatter = require('./formatter')

module.exports = {
  transports: [{
    constructor: 'Console',
    options: {
      colorize: true,
      level: 'debug',
      timestamp: () => Date.now(),
      formatter: (info) => formatter(info)
    }
  }, {
    package: 'winston-daily-rotate-file',
    constructor: 'DailyRotateFile',
    options: {
      filename: expandHomeDir(`${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK}/`) + '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      zippedArchive: true
    }
  }]
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
