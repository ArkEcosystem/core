![ARK Core](banner.png)

# ARK - Client

## Installation

```bash
yarn add @arkecosystem/client
```

If you want to use the CDN version, is available two bundles:

- Without the [@arkecosystem/crypto](http://github.com/ArkEcosystem/ArkEcosystem/core/packages/crypto) package: (_You will need to import both_)

```html
<script src="https://unpkg.com/@arkecosystem/crypto/dist/index.umd.js"></script>
<script src="https://unpkg.com/@arkecosystem/client/dist/index.umd.js"></script>
```

- And a standalone file:

```html
<script src="https://unpkg.com/@arkecosystem/client/dist/bundle.umd.js"></script>
```

## Usage

Import the library in node.js:

```
import ArkEcosystemClient from @arkecosystem/client
```

Use the library:

```
const client = new ArkEcosystemClient('<your host here>')
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [Lúcio Rubens](https://github.com/luciorubeens)
- [Alex Barnsley](https://github.com/alexbarnsley)
- [Juan A. Martín](https://github.com/j-a-m-l)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
