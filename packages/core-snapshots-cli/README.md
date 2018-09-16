![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Snapshots-CLI

## Installation

```bash
yarn add @arkecosystem/core-snapshots
```

## Usage
The plugin allows for manipulation, creation and import functionality of various snapshots via CLI interface

### Creating a fresh new snapshot
The following action creates a new snapshot in .ark/snapshots/devnet/ folder.
```bash
yarn create:devnet
```
### Importing a snapshot
The following action imports a snapshot from .ark/snapshots/devnet/ folder. Snapshot filename must be specified.
>Make sure that your node is not running.
```bash
yarn import:devnet -a import -f snapshot.220359.gz
```

### Rolling back an existing snapshot
It is possible to rollback an existing snapshot and create a new one with lower height. The command bellow creates a new snapshot file, that includes only the heights up to the specified height (1500). Think of this action as truncating and existing snapshot and creating a new one.
```bash
yarn rollback:devnet -f snapshot.218610.gz -h 1500
```

### Appending data to  an existing snapshot
To enable rolling snapshost and their faster execution, it is possible to append blocks to the snapshot from the last specified one.
The command below opens the snapshost, reads the missing blocks from the blockchain and appends it to a new snapshot file.
```bash
yarn append:devnet -f snapshot.15000.gz
```

## Security
If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Kristjan Košič](https://github.com/kristjank)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
