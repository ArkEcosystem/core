![ARK Core](https://i.imgur.com/1aP6F2o.png)

# Purpose of this plugin
The purpose of this plugin is to provide local snapshot functionality, so in case of issues the blockchain can be rebuild locally from own exported data.
The plugin provides a cli interface, with the following available commands:

- create (with option to append, or to select `--start` and `--end` block height to export)
- import
- verify
- rollback (and backup forged transactions during the process)

The commands and their usage is described below.

## Installation
```bash
yarn add @arkecosystem/core-snapshots
```
## Usage
The plugin allows for manipulation, creation and import functionality of various snapshots via the CLI interface

### Creating a fresh new snapshot
The following action creates a new snapshot in ./ark/snapshots/devnet/ folder.
```bash
yarn create:devnet
```
The command will generate snapshot files in your configured folder. By default this folder will be in `~.ark/snapshots/NETWORK_NAME`.
Files names are following this pattern:  `table.startHeight.endHeight.ark`. For example, command `yarn create:devnet` will create the following files:
- blocks.0.331985.ark
- transactions.0.331985.ark

The filename `blocks.0.331985.ark` indicates that the snapshot includes data between block 0 and block 331985.

A snapshot can also be created by specifying `--start` and `--end` options where we can specify start and end block height we want to export.

#### Selecting codec for export
Snapshot creation supports three different codes, to work with. Each of them is a balance between speed and size of the local snapshot. Currently we have:
- lite codec: uses basic serialization with minimall storage informations. It is the default choice between size and speed
- ark codec: uses Ark's block and transactions serialization/deserialization mechanism to store and import data. It is a bit slower than lite codec, but uses less data.
- msgpack coded: uses msgpack's library default compression, giving us maximum speed, but also maximum disk size usage.

Snapshots created with a selected codec have their corresponding file extensions (`lite`, `ark` and `msgpack`), when naming files. For example a snapshot file created with lite codec would look like this: `blocks.1.100.lite`. When importing codec is selected from the filename extension, so please do not rename snapshot files.

### Append data to an existing snapshot
To enable rolling snapshost and their faster import execution, it is possible to append data to an the existing snapshot.
The command is the same as for creating of snapshot with additional parameter for `-f` or `--filename` where we specify the existing snapshot we want to append to.
As a filename you only provide the `blocks.X.X.ark` filename, for example `blocks.0.331985.ark`. Other files are auto appended.

When append is complete a new file is created, while preserving the old snapshost. You must manually delete old files if needed.
```bash
yarn create:devnet -f blocks.0.331985.ark
```

### Importing a snapshot
The following action imports a snapshot from .ark/snapshots/devnet/ folder. Snapshot filename must be specified. You specify only first filename - from the blocks.

>Make sure that your node is not running.

```bash
yarn import:devnet -f blocks.0.331985.ark
```
> Add option `--truncate` to empty all the tables before import

```bash
yarn import:devnet -f blocks.0.331985.ark --truncate
```
#### Verifiying records during import `--signature-verify`
If you want to do additional `crpto.verify` check for each block and transaction a flag `--signature-verify` can be added to the import command
```bash
yarn import:devnet -f blocks.0.331985.ark --truncate --signature-verify
```
>Please not that this will increase the import time drastically.

By default behaviour when snapshot is imported, the block heigth is set to last finished round (some blocks are deleted at the end). If you have more snaphshot files following each other, then you can disable this with the `--skip-revert-round` flag. If this flag is present, block height will not be reverted at the end of import.

### Verify existing snapshot
If is wise to validate a snapshot. Functionality is simillar to import, just that there is no database interaction - so basic chain validation with crypto. To check your snapshot run the following command.
```bash
yarn verify:devnet -f blocks.0.331985.ark
```
You can also just verify the chaining process and skip signature verification with `--skip-sign-verify` option.
```bash
yarn verify:devnet -f blocks.0.331985.ark --skip-sign-verify
```
Also note that a database verification is performed when the core starts.

### Rolling back chain
The command enables you to rollback you local blockhain database. By specifying the end height you can rollback chain to a history state.
```bash
yarn rollback:devnet -b 350000
```
Above command will rollback the chain to block height of 350000.

If the `-b` or `--block-height` argument is not set, the command will rollback the chain to the last completed round.

Rollback command also makes a backup of forged transactions. Transactions are stored next to the snapshot files (in `./ark/snapshots/NETWORK_NAME`). File is named `rollbackTransactionBackup.startBlockHeight.endBlockHeight.json`, for example: rollbackTransactionBackup.53001.54978.json containes transactions from block 53001 to block 54978.

## Security
If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits
- [Kristjan Košič](https://github.com/kristjank)
- [All Contributors](../../../../contributors)

## License
[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
