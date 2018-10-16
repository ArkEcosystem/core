![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Winston Logger

## Installation

```bash
yarn add @arkecosystem/core-logger-winston
```

## Configuration

```js
module.exports = {
  transports: {
    console: {
      constructor: 'Console',
      options: {
        level: process.env.ARK_LOG_LEVEL || 'debug',
        format: require('./formatter')
      }
    },
    dailyRotate: {
      package: 'winston-daily-rotate-file',
      constructor: 'DailyRotateFile',
      options: {
        level: process.env.ARK_LOG_LEVEL || 'debug',
        filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/current.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '10'
      }
    }
  }
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
