![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Snapshots-CLI

The purpose of this plugin is to provide local snapshot functionality, so in case of issues the blockchain can be rebuild locally from own exported data.
The plugin provides a cli interface, with the following available commands:

- create
- append
- slice
- import
- verify

The commands and their usage is described below.

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

### Slicing snapshot
It is possible to slice an existing snapshot and create a new one. There are a few parameters available `--start` for new start heigh of snapshot and `--end` for new end height of snapshot.
If no start is specified, it defaults to 0.
if no end is specified, it defaults to current input snapshot file height.

>The command below slices the existing snapshot to heights from 0 to 1500
```bash
yarn slice:devnet -f snapshot.218610.gz -end 1500
```

>The command below slices the existing snapshot to heights from 2 to 1000
```bash
yarn slice:devnet -f snapshot.218610.gz --start 2 -end 1000
```

>The command below slices the existing snapshot from height 130000 to endheight of snapshost file 218610.
```bash
yarn slice:devnet -f snapshot.218610.gz --start 130000
```


### Append data to an existing snapshot
To enable rolling snapshost and their faster execution, it is possible to append blocks to the snapshot from the last specified one.
The command below opens the snapshost, reads the missing blocks from the blockchain and appends it to a new snapshot file.
```bash
yarn append:devnet -f snapshot.15000.gz
```

### Verify existing snapshot
If is wise to validate a snapshot. Functionality is simillar to import, just that there is no db and pipe interaction - so is basic chain validation with crypto. To check your snapshot run the following command.
```bash
yarn verify:devnet -f snapshot.15000.gz
```


## Security
If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Kristjan Košič](https://github.com/kristjank)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
