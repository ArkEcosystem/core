<<<<<<< HEAD
# PHANTOM Core - P2P API

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Documentation

You can find installation instructions and detailed instructions on how to use this package at the [dedicated documentation site](https://docs.phantom.org/guidebook/core/plugins/core-p2p.html).
=======
![PHANTOM Core](https://i.imgur.com/dPHOKrL.jpg))

# PHANTOM Core - P2P API

## Installation

```bash
yarn add @phantomcore/core-p2p
```

## Configuration

### Defaults

```js
module.exports = {
  port: process.env.PHANTOM_P2P_PORT || 4002,
  remoteinterface: true,
  dns: [
    // Google
    '8.8.8.8',
    '8.8.4.4',
    // CloudFlare
    '1.1.1.1',
    '1.0.0.1',
    // OpenDNS
    '208.67.222.222',
    '208.67.220.220'
  ],
  ntp: [
    'pool.ntp.org',
    'time.google.com'
  ]
}
```
>>>>>>> renaming

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
