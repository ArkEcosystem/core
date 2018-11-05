![ARK Core](https://i.imgur.com/1aP6F2o.png)

# Purpose of this plugin
The purpose of this plugin is to provide local snapshot functionality, so in case of issues the blockchain can be rebuild locally from own exported data.

Snapshot files will be generated in your configured folder. By default this folder will be in `~.ark/snapshots/NETWORK_NAME`.
Files names are following this pattern:  `table.startHeight.endHeight.dat`. For example, command `yarn create:devnet` will create the following files:
- blocks.0.331985.dat
- transactions.0.331985.dat

The filename `blocks.0.331985.dat` indicates that the snapshot includes data between block 0 and block 331985.

The functionalitye enables the usage of creating, appending, rolling back and import of snaphsot data to the blockchain.

It can be also used from the `cli`. Please check the `core-snapshosts-cli` documentation for that.

## Security
If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits
- [Kristjan Košič](https://github.com/kristjank)
- [All Contributors](../../../../contributors)

## License
[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
