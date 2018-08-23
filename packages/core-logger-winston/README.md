<<<<<<< HEAD
# PHANTOM Core - Winston Logger

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Documentation

You can find installation instructions and detailed instructions on how to use this package at the [dedicated documentation site](https://docs.phantom.org/guidebook/core/plugins/core-logger-winston.html).
=======
![PHANTOM Core](https://i.imgur.com/dPHOKrL.jpg))

# PHANTOM Core - Winston Logger

## Installation

```bash
yarn add @phantomcore/core-logger-winston
```

## Configuration

### Defaults

```js
module.exports = {
  transports: {
    console: {
      constructor: 'Console',
      options: {
        colorize: true,
        level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        timestamp: () => Date.now(),
        formatter: (info) => require('./formatter')(info)
      }
    },
    dailyRotate: {
      package: 'winston-daily-rotate-file',
      constructor: 'DailyRotateFile',
      options: {
        filename: `${process.env.PHANTOM_PATH_DATA}/logs/core/${process.env.PHANTOM_NETWORK_NAME}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        zippedArchive: true
      }
    }
  }
}
```
>>>>>>> renaming

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@phantom.org. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
