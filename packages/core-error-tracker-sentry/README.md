# Ark Core - Error Tracker - Sentry

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-error-tracker-sentry
```

## Configuration

> Check https://docs.sentry.io/quickstart?platform=node to find your DSN and more information about available options.

```js
module.exports = {
  dsn: process.env.ARK_ERROR_TRACKER_SENTRY_DSN,
  debug: true,
  attachStacktrace: true,
  environment: process.env.ARK_NETWORK_NAME
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
