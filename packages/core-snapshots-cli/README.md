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
The following action creates a new snapshot in .ark/snapshots/devnet/ folder.
```bash
yarn create:devnet
```
The command will generate snapshot files in your configured folder. By default this folder will be in `~.ark/snapshots/NETWORK_NAME`.
Files names are following this pattern:  `table.startHeight.endHeight.dat`. For example, command `yarn create:devnet` will create the following files:
- blocks.0.331985.dat
- transactions.0.331985.dat

The filename `blocks.0.331985.dat` indicates that the snapshot includes data between block 0 and block 331985.

A snapshot can be also created by specifying `--start` and `--end` options where we can specify start end end block height we want to export.

### Append data to an existing snapshot
To enable rolling snapshost and their faster import execution, it is possible to append data to the existing snapshot.
The command is the same as for creating of snapshot with additional parameter for `-f` or `--filename` where we specify the existing snapshot we want to append.
As a filename you only provide the `blocks.X.X.dat` filename, for example `blocks.0.331985.dat`. Other files (`transactions.dat, rounds.dat`) are auto appended.

When append is complete a new file is created, while preserving the old snapshost. You must manually delete old files if needed.
```bash
yarn create:devnet -f blocks.0.331985.dat
```

### Importing a snapshot
The following action imports a snapshot from .ark/snapshots/devnet/ folder. Snapshot filename must be specified. You specify only first filename - from the blocks.
>Make sure that your node is not running.
```bash
yarn import:devnet -f blocks.0.331985.dat
```
> Add option `--truncate` to empty all the tables before import
```bash
yarn import:devnet -f blocks.0.331985.dat --truncate
```
#### Speeding up the import of large amounts of data
If your snapshot is large and import slow, there is an option to disable signature verification checks. Imports are still validated according to their own hashes and if blocks are correctly chained.
```bash
yarn import:devnet -f blocks.0.331985.dat --truncate --skip-sign-
```

By default behaviour when snapshot is imported, the block heigth is set to last finished round (some blocks are deleted at the end). If you have more snaphshot files following each other, then you can disable this with the `--skip-revert-round` flag. If this flag is present, block height will not be reverted at the end of import.

### Verify existing snapshot
If is wise to validate a snapshot. Functionality is simillar to import, just that there is no database interaction - so basic chain validation with crypto. To check your snapshot run the following command.
```bash
yarn verify:devnet -f blocks.0.331985.dat
```
You can also just verify the chaining process and skip signature verification with `--skip-sign-verify` option.
```bash
yarn verify:devnet -f blocks.0.331985.dat --skip-sign-verify
```
Also note that a database verification is performed when the core starts.

### Rolling back chain
The command enables you to rollback you local blockhain database. By specifying the end height you can rollback chain to a history state.
```bash
yarn rollback:devnet -h 350000
```
Above command will rollback the chain to block height of 350000.

If the `-h` or `--height` argument is not set, the command will rollback the chain to the last completed round.

Rollback command also makes a backup of forged transactions. Transactions are stored next to the snapshot files (in `./ark/snapshots/NETWORK_NAME`). File is named `rollbackTransactionBackup.startBlockHeight.endBlockHeight.json`, for example: rollbackTransactionBackup.53001.54978.json containes transactions from block 53001 to block 54978.

## Security
If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits
- [Kristjan Košič](https://github.com/kristjank)
- [All Contributors](../../../../contributors)

## License
[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
