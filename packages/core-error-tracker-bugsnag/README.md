# Ark Core - Error Tracker - Bugsnag

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-error-tracker-bugsnag
```

## Configuration

> Check https://docs.bugsnag.com/platforms/nodejs/other/configuration-options/ for more options and details.

```js
module.exports = {
  apiKey: process.env.ARK_ERROR_TRACKER_BUGSNAG_API_KEY,
  configuration: {
    metaData: {
      network: process.env.ARK_NETWORK_NAME
    }
  }
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
