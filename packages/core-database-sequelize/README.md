![PHANTOM Core](https://i.imgur.com/dPHOKrL.jpg))

# PHANTOM Core - Sequelize Database Provider

## Installation

```bash
yarn add @phantomcore/core-database-sequelize
```

## Configuration

### Defaults

```js
module.exports = {
  dialect: 'sqlite',
  storage: `${process.env.PHANTOM_PATH_DATA}/database/${process.env.PHANTOM_NETWORK_NAME}.sqlite`,
  logging: process.env.PHANTOM_DB_LOGGING
}
```

If you want to see all available configuration properties head over to http://docs.sequelizejs.com/manual/installation/usage.html#options.

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@phantom.org. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Kristjan Košič](https://github.com/kristjank)
- [Brian Faust](https://github.com/faustbrian)
- [Alex Barnsley](https://github.com/alexbarnsley)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
