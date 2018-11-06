![ARK Core](https://i.imgur.com/1aP6F2o.png)

# Purpose of this plugin
The purpose of this plugin is to provide local snapshot functionality, so in case of issues the blockchain can be rebuild locally from own exported data.
The plugin provides a cli interface, with the following available commands:

- create (with option to append, or to select `--start` and `--end` block height to export)
- import
- verify
- rollback (and backup forged transactions during the process)
- truncate

The commands and their usage is described below.

## Installation
```bash
yarn add @arkecosystem/core-snapshots-cli
```
## Usage
The plugin allows for manipulation, creation and import functionality of various snapshots via the CLI interface

### Creating a fresh new snapshot
The following action creates a new snapshot in ./ark/snapshots/devnet/ folder.
```bash
yarn create:devnet
```
The command will generate snapshot files in your configured folder. By default this folder will be in `~./ark/snapshots/NETWORK_NAME`.
Files names are following this pattern:  `table.codec`. For example, command `yarn create:devnet` will create the following files in the folder:
`~./ark/snapshots/NETWORK_NAME/0-331985/`
- blocks.lite
- transactions.lite

The folder `0-331985` indicates that the snapshot includes data between block 0 and block 331985.

A snapshot can also be created by specifying `--start` and `--end` options where we can specify start and end block height we want to export.

#### Selecting codec for export
Snapshot creation supports three different codecs, to work with. Each of them is a balance between speed and size of the local snapshot. Currently we have:
- lite codec: uses basic serialization with minimall storage informations. It is the default choice between size and speed
- ark codec: uses Ark's block and transactions serialization/deserialization mechanism to store and import data. It is a bit slower than lite codec, but uses less data.
- msgpack coded: uses msgpack's library default compression, giving us maximum speed, but also maximum disk size usage.

```bash
  yarn create:devnet --codec lite
```

Snapshots created with a selected codec have their corresponding file extensions (`lite`, `ark` and `msgpack`), when naming files. For example a snapshot file created with lite codec would look like this: `blocks.lite`.

### Append data to an existing snapshot
To enable rolling snapshost and their faster import execution, it is possible to append data to an the existing snapshot.
The command is the same as for creating of snapshot with additional parameter for `-b` or `--blocks` where we specify the existing snapshot blocks/folder we want to append to.
As a `--blocks` parameter you only provide the `0-331985` blocks number or folder name, for example `yarn create:devnet --blocks 0-331985`.

When append is completed a new folder is created, while preserving the old snapshost. You must manually delete snapshost folders if needed.

### Importing a snapshot
The following action imports a snapshot from .ark/snapshots/devnet/ folder. Snapshot filename must be specified. You specify only first filename - from the blocks.

>Make sure that your node is not running.

```bash
yarn import:devnet -b 0-331985
```
> If you want to import from block 1, e.g. empty database first, you should run the `yarn truncate:NETWORK_NAME` command or add `--truncate` parameter to the `import` command.
```bash
yarn truncate:devnet
```
Using the `--truncate` parameter
```bash
yarn import:devnet -b 0-331985 --truncate
```
#### Verifiying records during import `--signature-verify`
If you want to do additional `crpto.verify` check for each block and transaction a flag `--signature-verify` can be added to the import command
```bash
yarn import:devnet --blocks 0-331985 --truncate --signature-verify
```
>Please not that this will increase the import time drastically.

By default behaviour when snapshot is imported, the block heigth is set to last finished round (blocks are deleted at the end). If you have more snaphshot files following each other, then you can disable this with the `--skip-revert-round` flag. If this flag is present, block height will not be reverted at the end of import to last completed round.

### Verify existing snapshot
If is wise to validate a snapshot. Functionality is simillar to import, just that there is no database interaction - so basic chain validation with crypto. To check your snapshot run the following command.
```bash
yarn verify:devnet --blocks 0-331985
```
You can also just verify the chaining process and skip signature verification with `--skip-sign-verify` option.
```bash
yarn verify:devnet --blocks 0-331985 --skip-sign-verify
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
