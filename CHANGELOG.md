# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.5.0] - 2019-MM-DD

### Added

-   Allow retrieval of raw blocks and transactions via API ([#2616])
-   Search transactions by asset via API ([#2618])

### Removed

-   Removed the `ark-node` legacy API known as `v1` ([#2577])

## [2.4.0] - 2019-MM-DD

All changes listed in this section are things that either alter how certain data in core is treated and processed or changes to the public API of a package.

As we move towards 2.6 and the completion of AIP11, AIP18 and AIP29 there will be various breaking changes. The main concern of most developers will be breaking changes to `@arkecosystem/crypto` so go through the commits listed below and make sure .

-   Implement WebSockets with SocketCluster ([#2273])
-   Switch transaction expiration from seconds to chain height ([#2461])
-   Implement Block.fromHex, Block.fromBytes and Block.fromData methods in `@arkecosystem/crypto` ([#2377])
-   Implement BlockFactory in `@arkecosystem/crypto` ([#2429])
-   Implement TransactionFactory in `@arkecosystem/crypto` ([#2437])
-   Purge invalid transactions after a milestone change ([#2499])
-   Always use crypto identities to work with keys and addresses ([#2443])
-   Enforce BigNumber for satoshi based values ([#2391])
-   Move in-memory wallet logic to core-state ([#2489])
-   Replace bignumify with Utils.BigNumber.make ([#2416])
-   Bind plugin options before registering the plugin ([#2375])
-   Extend the node.js event emitter ([#2440])
-   Move the wallet interfaces to `@arkecosystem/core-state` ([#2515])
-   Simplify the transaction pool by not using insertion order ([#2495])
-   Drop no longer needed pagination from `@arkecosystem/core-webhooks` ([#2424])
-   Extract transaction signing and utils out of the model in `@arkecosystem/crypto` ([#2514])
-   Extract transaction verification out of the model in `@arkecosystem/crypto` ([#2506])
-   Make all `Slots.*` methods static in `@arkecosystem/crypto` ([#2473])
-   Move interfaces, types and models in `@arkecosystem/crypto` ([#2379])
-   Remove extraneous Client class in `@arkecosystem/crypto` ([#2417])
-   Split the `Crypto` class into `Hash` and `Transaction` in `@arkecosystem/crypto` ([#2444])
-   Remove unused methods to get/set/reset height from `Slots` ([#2467])

### Added

-   Implement in `@arkecosystem/core-state` to manage the state of in-memory data ([#2479])
-   Implement a blockchain replay command ([#2526])
-   Save blocks in batches during sync ([#2500])
-   Implement v2/node/fees endpoint ([#2393])
-   Allow setting a vendor field for transactions created via `@arkecosystem/core-json-rpc` ([#2425])
-   Limit the number of accepted peers per subnet ([#2507])
-   Implement WebSockets with SocketCluster ([#2273])
-   Parallel block download ([#2433])
-   In-memory storage for last N blocks and transactions ([#2492])
-   Switch transaction expiration from seconds to chain height ([#2461])
-   Require the user to choose a snapshot if the blocks flag is missing in `@arkecosystem/core` commands ([#2522])
-   Implement Block.fromHex, Block.fromBytes and Block.fromData methods in `@arkecosystem/crypto` ([#2377])
-   Implement BlockFactory in `@arkecosystem/crypto` ([#2429])
-   Implement TransactionFactory in `@arkecosystem/crypto` ([#2437])
-   Integrate end-to-end tests ([#2468])
-   Initial Implementation of `core-wallet-api` ([#2544])
-   Accept block height to list block transactions in `core-api` ([#2567])
-   Functional test matchers for `core-jest-matchers` ([#2562])
-   Don't trust headers and verify config and plugin connectivity of peers ([#2559], [#2553], [#2552])
-   Proxy API calls to core-api until fully developed ([#2558])
-   Add database configuration command to CLI ([#2557], [#2563])
-   Add command to generate network configuration CLI ([#2582])

### Fixed

-   Insert the genesis block as soon as the database is ready ([#2376])
-   Purge invalid transactions after a milestone change ([#2499])
-   Use public API to auto-configure `@arkecosystem/core-tester-cli` ([#2517])
-   Parse only the last line of pm2 stdout to avoid parsing faulty input ([#2484])
-   Delete bad rounds after unclean shutdown ([#2581])
-   Divide blocks into smaller chunks for batch processing ([#2586])
-   Remove forged transactions from pool before discarding block ([#2555])
-   Make transaction amount required ([#2574])
-   Various sync issues with devnet and mainnet ([#2565])
-   Do not suspend peer for `AppNotReady` ([#2590])

### Changed

-   Always use crypto identities to work with keys and addresses ([#2443])
-   Enforce BigNumber for satoshi based values ([#2391])
-   Move in-memory wallet logic to core-state ([#2489])
-   Replace bignumify with Utils.BigNumber.make ([#2416])
-   Replace Joi with AJV for internal validation ([#2426])
-   Bind plugin options before registering the plugin ([#2375])
-   Extend the node.js event emitter ([#2440])
-   Move the wallet interfaces to `@arkecosystem/core-state` ([#2515])
-   Remove height difference ban for peers ([#2360])
-   Simplify the transaction pool by not using insertion order ([#2495])
-   Drop no longer needed pagination from `@arkecosystem/core-webhooks` ([#2424])
-   Extract transaction signing and utils out of the model in `@arkecosystem/crypto` ([#2514])
-   Extract transaction verification out of the model in `@arkecosystem/crypto` ([#2506])
-   Make all `Slots.*` methods static in `@arkecosystem/crypto` ([#2473])
-   Move interfaces, types and models in `@arkecosystem/crypto` ([#2379])
-   Move mainnet exceptions to config in `@arkecosystem/crypto` ([#2529])
-   Remove extraneous Client class in `@arkecosystem/crypto` ([#2417])
-   Split the `Crypto` class into `Hash` and `Transaction` in `@arkecosystem/crypto` ([#2444])
-   Invalidate blocks with expired transactions ([#2528])
-   Transaction type agnostic wallet bootstrap to support AIP29 ([#2539])
-   Return all schema errors in hapi-ajv (#2571)
-   Clean up SocketCluster shutdown and logging (#2560)
-   Remove timeout banning ([#2597])

### Removed

-   Remove unused methods to get/set/reset height from `Slots` ([#2467])

## [2.3.23] - 2019-05-21

### Fixed

-   Allow the use of old and new block IDs via `core-json-rpc` ([#2593])

## [2.3.22] - 2019-05-02

### Changed

-   Return transaction timestamp instead of block timestamp for `/v2/*` endpoints in `core-api` ([#2513])
    -   **Note that the transaction timestamp can be misleading as a transaction can be signed hours or days before it gets forged which is why you should rely on the block timestamp because that is the point in time when the blockchain becomes aware of a transaction.**

## [2.3.21] - 2019-04-30

### Fixed

-   Avoid getting stuck on a peer by picking a random one each time _(JSON-RPC)_ ([#2491])
-   Fix the asset import and include `rounds` in the snapshot to avoid issues with the peer verifier ([#2502])
-   Accept requests to /transactions regardless of suspension _(only caused issues for nodes that are completely locked down behind a firewall with no incoming connections)_ ([#2503])

## [2.3.18] - 2019-04-26

### Fixed

-   Reset unfinished round after importing a snapshot ([#2486])
-   Update the height of the crypto config manager for milestones in the forger _(only caused an issue for split setups)_ ([#2487])

## [2.3.16] - 2019-04-25

### Fixed

-   Initialise the crypto config manager with the latest height on boot ([#2482])

## [2.3.15] - 2019-04-25

Fix release of `2.3.14` due to npm connectivity issues.

## [2.3.14] - 2019-04-25

### Fixed

-   Added missing mainnet exceptions for transactions with invalid recipients ([#2471])
-   Remove support for old release channels from the 2.2 development period ([#2476])

## [2.3.12] - 2019-04-24

### Fixed

-   Use correct genesis block instead to verify snapshots ([#2462])
-   Don't pass suffix flag to bip38 and bip39 commands ([#2464])

## [2.3.1] - 2019-04-23

### Fixed

-   Deserialize type > 0 with vendor field instead of skipping it ([#2459])

## [2.3.0] - 2019-04-23

### Breaking Changes

-   Removed the `wallets` table from the database ([#2209])
    -   **Core 2.0 has been fully reliant on in-memory wallets since the 2.0 release. This only removes the dumping of wallets into the database as it is wasted space and doesn't serve any purpose.**
    -   **If you have applications that rely on the database you should migrate them as soon as possible to using the API as only that data is provided in real-time.**
-   Replace SQLite3 with [lowdb](https://github.com/typicode/lowdb) in `core-webhooks` ([#2124])
    -   **This significantly reduces the size of the package and it's dependencies.**
    -   **This requires you to recreate your webhooks as the storage method changed.**
-   Replaced `core-logger-winston` with `core-logger-pino` ([#2134])
    -   **This significantly improves performance of logging when it occurs a lot in situations like syncing or rollbacks.**
-   Rewrote `core-tester-cli` from scratch ([#2133])
-   Merged `core-debugger-cli` into `core-tester-cli` and deprecated it ([#2133])
-   Use the node.js `EventEmitter` from `events` instead of `eventemitter3` ([#2329])

### Added

-   Implement AIP29 ([#2122])
-   Search delegates by their username in `core-api` ([#2143])
-   Implemented the `ark reinstall` command in `core` ([#2192])
-   Added the `--force` flag to the `ark update` command in `core` ([#2190])
-   Added more parameters for delegate searches in `core-api` ([#2184])
-   Added restart flags to the `ark update` command in `core` ([#2218])
-   Added the `make:block` command to `core-tester-cli` to create blocks ([#2221])
-   Added the `core-error-tracker-rollbar` package ([#2287])
-   Added the `core-error-tracker-raygun` package ([#2288])
-   Added the `core-error-tracker-airbrake` package ([#2289])
-   Added the `core-logger-signale` package ([#2343])
-   Added more events for blocks and the transaction pool ([#2321])
-   Return `slip44` and `wif` via `v2/node/configuration` ([#2388])
-   Added an `asset` column to the `transactions` table ([#2236])

### Fixed

-   Properly sort peers by their version ([#2229])
-   Memory leak in the monitoring process of `core-forger` ([#2341])
-   Handle dynamic round sizes with milestones ([#2370])
-   Validate that a transaction recipient is on the same network ([#2394])
-   Handle empty `rows` in `mapBlocksToTransactions` ([#2404])
-   Prevent indexing/creating of ghost wallets ([#2405])
-   Refuse transactions from senders with pending second signature registrations and do not rollback when refusing a block ([#2458])

### Changed

-   Increased the vendor field length to 255 bytes ([#2159])
-   Replaced `micromatch` with `nanomatch` to improve performance ([#2165])
-   Replaced `axios` with `got` to resolve known timeout issues with `axios` ([#2203])
-   Switch block id to full SHA256 ([#2156])

### Removed

-   Removed dead fast rebuild code that hasn't been used since 2.0 release ([#2210])

## [2.2.2] - 2019-03-19

### Removed

-   Remove `/api/v2/delegates/{id}/voters/balances` endpoint ([#2265])

## [2.2.0] - 2019-03-11

### Added

-   Implement a CLI with @oclif to replace commander ([#2100])
-   Add sorting to voters endpoint ([#2103])
-   Validate GET replies from other peers ([#2102])
-   Pass query to findAllByVote method ([#2142])
-   Fetch list of peers from at least a few others ([#2152])

### Fixed

-   Pass the base flags for programmatic calls in `core-tester-cli` ([#2108])
-   Reduce complexity and fix wrong offset handling in `core-elasticsearch` ([#2108])
-   Stuck at not ready to accept new block ([#2139])
-   Properly sort BigNumber values ([#2144])
-   Properly update wallet balances if a vote transaction is reverted ([#2207])
-   Invalid transactions after a rollback because block timestamps were used as transaction timestamp ([#2217])

### Changed

-   Replaced lodash.sortBy/orderBy with faster implementations ([#2106])
-   Improve fork handling in updatePeersOnMissingBlocks ([#2125])
-   Throw an error if the peers or plugins file are missing ([#2135])
-   Improve selection of peer for downloading blocks ([#2137])
-   Merge core-snapshot-cli commands into core ([#2149])

### Removed

-   Remove unnecessary ping call in ([#2123])
-   Remove broken getRandomDownloadBlocksPeer ([#2121])

## [2.1.2] - 2019-02-13

### Fixed

-   Fix quorum related issues
-   Limit payload size
-   Remove `signatures` from transaction payload

## [2.1.1] - 2019-02-12

### Fixed

-   Configuration endpoint does not show dynamic fees ([#2082])
-   Return the correct supply for the legacy API ([#2083])

## [2.1.0] - 2019-02-11

### Added

-   Added a `milestoneHash` identifier to use for peer banning ([#1837])
-   Added TypeScript declarations for `core-logger` ([#1833])
-   Added TypeScript declarations for `core-logger-winston` ([#1887])
-   Added TypeScript declarations for `core-container` ([#1891])
-   Added TypeScript declarations for `core-database` ([#1901], [#1905])
-   Added TypeScript declarations for `core-transaction-pool` ([#1906])
-   Added TypeScript declarations for `core-blockchain` ([#1943])
-   Added TypeScript declarations for `core-snapshots` ([#1947])
-   Added TypeScript declarations for `core-api` ([#1948])
-   Added TypeScript declarations for `crypto` ([#1917])
-   Added the `core-jest-matchers` package ([#1926])
-   Added the `core-interfaces` package ([#1924])
-   Return the transaction expiration time via API ([#1927])
-   Added the ability to disable the public API cache ([#1930])
-   Return the vote of a wallet via public API ([#2009])
-   Upgrade script for 2.1 ([#1999])
-   Installation script for deb/rpm distros ([#2016])
-   Case specific errors for `crypto` ([#2038])

### Changed

-   Migrated from JavaScript to TypeScript ([#1625])
-   Moved the `peers.json` configuration into `core-p2p` ([#1625])
-   Merged `core-transaction-pool-mem` into `core-transaction-pool` ([#1625])
-   Use a faster alternative to derive an estimate ([#1655])
-   Reworked crypto configuration to make it simpler ([#1733])
-   Moved the dynamic fees configuration into `core-transaction-pool` ([#1733])
-   Periodically check for new peers instead of retrying until finding some ([#1738])
-   Adjusted some banning times for peers to make network recovery smoother ([#1730])
-   Simplified configuration by further separating network and core ([#1733])
-   Take the `minFeeBroadcast` value into account for fee statistics ([#1873])
-   Only allow vendor fields for type 0 and 6 transactions ([#1931])
-   Improved the network quorum details and feedback ([#1898])
-   Only return errors when broadcast and pool fees are too low ([#1940])
-   Improved performance of BIP38 ([#1941])
-   Cleaned up the logic of block processing ([#1953])
-   Cleaned up the logic of serialise/deserialise in crypto ([#1969])
-   Replaced all ARK naming with CORE ([#1970])
-   Use system paths for data and configuration ([#1987])
-   Increased the maximum transaction age to 6 hours ([#1996])
-   Replaced progress bars with logging to reduce noise ([#2044])
-   Replaced commander.js with @oclif in `core-debugger-cli` ([#2049])
-   Replaced commander.js with @oclif in `core-snapshots-cli` ([#2050])
-   Replaced commander.js with @oclif in `core-tester-cli` ([#2051])
-   Moved docker files from `docker/*` to `docker/development/*` ([#2053])
-   Moved the genesis blocks from the `core` configuration to the network configuration in `crypto` ([#2052])
-   Separate business-logic from data-layer logic ([#2055])

### Fixed

-   Resolved an issue with the `resolveOptions` method that would result in options being resolved for plugins that are not registered in the container ([#1625])
-   Malformed condition for filtering peers ([#1689])
-   Use the correct pagination schema for the v2 public API ([#1717])
-   Ensure that delegate searches can handle undefined values ([#1831])
-   Mark semantically invalid versions as invalid overall ([#1836])
-   Ordering of delegates via public API ([#1731])
-   Handle webhooks that have no conditions ([#1869])
-   Validate the network byte on transactions ([#1853])
-   Use correct schemas for address, public key and username validation in the public API ([#1954])
-   Populate the last block of all delegates ([#1919])
-   Return the transaction forging timestamp instead of signing timestamp ([#1957])
-   Mark cold wallets as not found in the legacy API ([#1955])
-   A malformed condition that resulted in wrong peer lists ([#1939])
-   Properly verify block slot timestamps ([#1985])
-   Return fixed peer states for v1 and v2 API responses ([#2027])
-   Validate IP ranges to detect loopbacks ([#2045])
-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-010.md ([#2046])
-   Check if the blockchain state storage is available before performing fork checks ([#2047])
-   Gracefully handle a corrupted cached `peers.json` file ([#2061])
-   Always sort transactions by sequence and the requested field to make API sorting deterministic ([#2058])
-   Disallow multiple registrations for same delegate ([#2080])

### Removed

-   Removed the `transactionsFromIds` P2P endpoint ([#1911])
-   Removed the `validator` and `rules` fron `@arkecosystem/crypto` ([#2021])
-   Ended support for the legacy multisignatures from the previous LISK fork ([#2057])

## [2.0.19] - 2019-01-31

### Fixed

-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-009.md
-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-010.md

## [2.0.18] - 2019-01-28

### Fixed

-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-011.md

## [2.0.17] - 2019-01-15

### Fixed

-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-008.md
-   https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-007.md

## [2.0.16] - 2018-12-17

### Fixed

-   Prevent the list of peers to become too short. This is related to the nodes running behind a firewall.

Closed security vulnerabilities:

-   [CORE-SV-004](https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-004.md)
-   [CORE-SV-003](https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-003.md)
-   [CORE-SV-002](https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-002.md)
-   [CORE-SV-001](https://github.com/ARKEcosystem/security-vulnerabilities/blob/master/core/core-sv-001.md)

## [2.0.15] - 2018-12-11

### Fixed

-   Ensure no local peers are enlisted and that the IP of the TCP connection is used ([#1695])

## [2.0.14] - 2018-12-10

### Fixed

-   Reset last downloaded block when block is discarded ([#1692])

## [2.0.13] - 2018-12-07

### Fixed

-   Ensure safe integer range for block height lookups via API ([#1673])

## [2.0.12] - 2018-12-06

### Fixed

-   Perform second-signature checks in the `canApply` logic of multi-signatures ([#1658])
-   return the encoded WIF for BIP38 wallets instead of the encrypted WIF ([#1653])

## [2.0.11] - 2018-12-05

### Added

-   Store executed migrations in the database ([#1648])

### Changed

-   Increase cache generation timeout and make it configurable ([#1645], [#1646])

## [2.0.1] - 2018-12-05

### Added

-   Retrieve blocks via height or ID per public API ([#1626])

### Changed

-   Improved performance for block and transaction queries by adding more indices on critical columns ([#1636], [#1638], [#1634])

### Fixed

-   Take milestones into account for supply calculations ([#1640])
-   Use the raw transaction data in `acceptChainedBlock` to avoid timestamp mismatches and second signature double spend errors ([#1564])
-   Return the correct peer count for the v2 public API ([#1563])

## [2.0.0] - 2018-12-03

-   Initial Release

[unreleased]: https://github.com/ARKEcosystem/core/compare/master...develop
[2.3.23]: https://github.com/ARKEcosystem/core/compare/2.3.22...2.3.23
[2.3.22]: https://github.com/ARKEcosystem/core/compare/2.3.21...2.3.22
[2.3.21]: https://github.com/ARKEcosystem/core/compare/2.3.18...2.3.21
[2.3.18]: https://github.com/ARKEcosystem/core/compare/2.3.16...2.3.18
[2.3.16]: https://github.com/ARKEcosystem/core/compare/2.3.15...2.3.16
[2.3.15]: https://github.com/ARKEcosystem/core/compare/2.3.14...2.3.15
[2.3.14]: https://github.com/ARKEcosystem/core/compare/2.3.12...2.3.14
[2.3.12]: https://github.com/ARKEcosystem/core/compare/2.3.1...2.3.12
[2.3.1]: https://github.com/ARKEcosystem/core/compare/2.3.0...2.3.1
[2.3.0]: https://github.com/ARKEcosystem/core/compare/2.2.2...2.3.0
[2.2.2]: https://github.com/ARKEcosystem/core/compare/2.2.1...2.2.2
[2.2.1]: https://github.com/ARKEcosystem/core/compare/2.2.0...2.2.1
[2.2.0]: https://github.com/ARKEcosystem/core/compare/2.1.2..2.2.0
[2.1.2]: https://github.com/ARKEcosystem/core/compare/2.1.1..2.1.2
[2.1.1]: https://github.com/ARKEcosystem/core/compare/2.1.0..2.1.1
[2.1.0]: https://github.com/ARKEcosystem/core/compare/2.0.19...2.1.0
[2.0.19]: https://github.com/ARKEcosystem/core/compare/2.0.18...2.0.19
[2.0.18]: https://github.com/ARKEcosystem/core/compare/2.0.17...2.0.18
[2.0.17]: https://github.com/ARKEcosystem/core/compare/2.0.16...2.0.17
[2.0.16]: https://github.com/ARKEcosystem/core/compare/2.0.15...2.0.16
[2.0.15]: https://github.com/ARKEcosystem/core/compare/2.0.14...2.0.15
[2.0.14]: https://github.com/ARKEcosystem/core/compare/2.0.13...2.0.14
[2.0.13]: https://github.com/ARKEcosystem/core/compare/2.0.12...2.0.13
[2.0.12]: https://github.com/ARKEcosystem/core/compare/2.0.11...2.0.12
[2.0.11]: https://github.com/ARKEcosystem/core/compare/2.0.1...2.0.11
[2.0.1]: https://github.com/ARKEcosystem/core/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/ARKEcosystem/core/compare/0.1.1...2.0.0
[#1563]: https://github.com/ARKEcosystem/core/pull/1563
[#1564]: https://github.com/ARKEcosystem/core/pull/1564
[#1625]: https://github.com/ARKEcosystem/core/pull/1625
[#1626]: https://github.com/ARKEcosystem/core/pull/1626
[#1634]: https://github.com/ARKEcosystem/core/pull/1634
[#1636]: https://github.com/ARKEcosystem/core/pull/1636
[#1638]: https://github.com/ARKEcosystem/core/pull/1638
[#1638]: https://github.com/ARKEcosystem/core/pull/1638
[#1640]: https://github.com/ARKEcosystem/core/pull/1640
[#1645]: https://github.com/ARKEcosystem/core/pull/1645
[#1646]: https://github.com/ARKEcosystem/core/pull/1646
[#1648]: https://github.com/ARKEcosystem/core/pull/1648
[#1653]: https://github.com/ARKEcosystem/core/pull/1653
[#1655]: https://github.com/ARKEcosystem/core/pull/1655
[#1658]: https://github.com/ARKEcosystem/core/pull/1658
[#1673]: https://github.com/ARKEcosystem/core/pull/1673
[#1689]: https://github.com/ARKEcosystem/core/pull/1689
[#1692]: https://github.com/ARKEcosystem/core/pull/1692
[#1695]: https://github.com/ARKEcosystem/core/pull/1695
[#1717]: https://github.com/ARKEcosystem/core/pull/1717
[#1730]: https://github.com/ARKEcosystem/core/pull/1730
[#1731]: https://github.com/ARKEcosystem/core/pull/1731
[#1732]: https://github.com/ARKEcosystem/core/pull/1732
[#1733]: https://github.com/ARKEcosystem/core/pull/1733
[#1738]: https://github.com/ARKEcosystem/core/pull/1738
[#1831]: https://github.com/ARKEcosystem/core/pull/1831
[#1833]: https://github.com/ARKEcosystem/core/pull/1833
[#1836]: https://github.com/ARKEcosystem/core/pull/1836
[#1837]: https://github.com/ARKEcosystem/core/pull/1837
[#1853]: https://github.com/ARKEcosystem/core/pull/1853
[#1869]: https://github.com/ARKEcosystem/core/pull/1869
[#1873]: https://github.com/ARKEcosystem/core/pull/1873
[#1887]: https://github.com/ARKEcosystem/core/pull/1887
[#1891]: https://github.com/ARKEcosystem/core/pull/1891
[#1898]: https://github.com/ARKEcosystem/core/pull/1898
[#1901]: https://github.com/ARKEcosystem/core/pull/1901
[#1905]: https://github.com/ARKEcosystem/core/pull/1905
[#1906]: https://github.com/ARKEcosystem/core/pull/1906
[#1911]: https://github.com/ARKEcosystem/core/pull/1911
[#1917]: https://github.com/ARKEcosystem/core/pull/1917
[#1919]: https://github.com/ARKEcosystem/core/pull/1919
[#1924]: https://github.com/ARKEcosystem/core/pull/1924
[#1926]: https://github.com/ARKEcosystem/core/pull/1926
[#1927]: https://github.com/ARKEcosystem/core/pull/1927
[#1930]: https://github.com/ARKEcosystem/core/pull/1930
[#1931]: https://github.com/ARKEcosystem/core/pull/1931
[#1939]: https://github.com/ARKEcosystem/core/pull/1939
[#1940]: https://github.com/ARKEcosystem/core/pull/1940
[#1941]: https://github.com/ARKEcosystem/core/pull/1941
[#1943]: https://github.com/ARKEcosystem/core/pull/1943
[#1947]: https://github.com/ARKEcosystem/core/pull/1947
[#1948]: https://github.com/ARKEcosystem/core/pull/1948
[#1953]: https://github.com/ARKEcosystem/core/pull/1953
[#1954]: https://github.com/ARKEcosystem/core/pull/1954
[#1955]: https://github.com/ARKEcosystem/core/pull/1955
[#1957]: https://github.com/ARKEcosystem/core/pull/1957
[#1969]: https://github.com/ARKEcosystem/core/pull/1969
[#1970]: https://github.com/ARKEcosystem/core/pull/1970
[#1985]: https://github.com/ARKEcosystem/core/pull/1985
[#1987]: https://github.com/ARKEcosystem/core/pull/1987
[#1996]: https://github.com/ARKEcosystem/core/pull/1996
[#1999]: https://github.com/ARKEcosystem/core/pull/1999
[#2009]: https://github.com/ARKEcosystem/core/pull/2009
[#2016]: https://github.com/ARKEcosystem/core/pull/2016
[#2021]: https://github.com/ARKEcosystem/core/pull/2021
[#2038]: https://github.com/ARKEcosystem/core/pull/2038
[#2044]: https://github.com/ARKEcosystem/core/pull/2044
[#2045]: https://github.com/ARKEcosystem/core/pull/2045
[#2046]: https://github.com/ARKEcosystem/core/pull/2046
[#2047]: https://github.com/ARKEcosystem/core/pull/2047
[#2049]: https://github.com/ARKEcosystem/core/pull/2049
[#2050]: https://github.com/ARKEcosystem/core/pull/2050
[#2051]: https://github.com/ARKEcosystem/core/pull/2051
[#2052]: https://github.com/ARKEcosystem/core/pull/2052
[#2053]: https://github.com/ARKEcosystem/core/pull/2053
[#2055]: https://github.com/ARKEcosystem/core/pull/2055
[#2057]: https://github.com/ARKEcosystem/core/pull/2057
[#2058]: https://github.com/ARKEcosystem/core/pull/2058
[#2061]: https://github.com/ARKEcosystem/core/pull/2061
[#2080]: https://github.com/ARKEcosystem/core/pull/2080
[#2082]: https://github.com/ARKEcosystem/core/pull/2082
[#2083]: https://github.com/ARKEcosystem/core/pull/2083
[#2091]: https://github.com/ARKEcosystem/core/pull/2091
[#2100]: https://github.com/ARKEcosystem/core/pull/2100
[#2102]: https://github.com/ARKEcosystem/core/pull/2102
[#2103]: https://github.com/ARKEcosystem/core/pull/2103
[#2106]: https://github.com/ARKEcosystem/core/pull/2106
[#2108]: https://github.com/ARKEcosystem/core/pull/2108
[#2119]: https://github.com/ARKEcosystem/core/pull/2119
[#2121]: https://github.com/ARKEcosystem/core/pull/2121
[#2122]: https://github.com/ARKEcosystem/core/pull/2122
[#2123]: https://github.com/ARKEcosystem/core/pull/2123
[#2124]: https://github.com/ARKEcosystem/core/pull/2124
[#2125]: https://github.com/ARKEcosystem/core/pull/2125
[#2133]: https://github.com/ARKEcosystem/core/pull/2133
[#2133]: https://github.com/ARKEcosystem/core/pull/2133
[#2134]: https://github.com/ARKEcosystem/core/pull/2134
[#2135]: https://github.com/ARKEcosystem/core/pull/2135
[#2137]: https://github.com/ARKEcosystem/core/pull/2137
[#2139]: https://github.com/ARKEcosystem/core/pull/2139
[#2142]: https://github.com/ARKEcosystem/core/pull/2142
[#2143]: https://github.com/ARKEcosystem/core/pull/2143
[#2144]: https://github.com/ARKEcosystem/core/pull/2144
[#2149]: https://github.com/ARKEcosystem/core/pull/2149
[#2152]: https://github.com/ARKEcosystem/core/pull/2152
[#2156]: https://github.com/ARKEcosystem/core/pull/2156
[#2159]: https://github.com/ARKEcosystem/core/pull/2159
[#2165]: https://github.com/ARKEcosystem/core/pull/2165
[#2184]: https://github.com/ARKEcosystem/core/pull/2184
[#2190]: https://github.com/ARKEcosystem/core/pull/2190
[#2192]: https://github.com/ARKEcosystem/core/pull/2192
[#2203]: https://github.com/ARKEcosystem/core/pull/2203
[#2205]: https://github.com/ARKEcosystem/core/pull/2205
[#2207]: https://github.com/ARKEcosystem/core/pull/2207
[#2209]: https://github.com/ARKEcosystem/core/pull/2209
[#2210]: https://github.com/ARKEcosystem/core/pull/2210
[#2217]: https://github.com/ARKEcosystem/core/pull/2217
[#2218]: https://github.com/ARKEcosystem/core/pull/2218
[#2221]: https://github.com/ARKEcosystem/core/pull/2221
[#2229]: https://github.com/ARKEcosystem/core/pull/2229
[#2236]: https://github.com/ARKEcosystem/core/pull/2236
[#2273]: https://github.com/ARKEcosystem/core/pull/2273
[#2287]: https://github.com/ARKEcosystem/core/pull/2287
[#2288]: https://github.com/ARKEcosystem/core/pull/2288
[#2289]: https://github.com/ARKEcosystem/core/pull/2289
[#2321]: https://github.com/ARKEcosystem/core/pull/2321
[#2329]: https://github.com/ARKEcosystem/core/pull/2329
[#2341]: https://github.com/ARKEcosystem/core/pull/2341
[#2343]: https://github.com/ARKEcosystem/core/pull/2343
[#2360]: https://github.com/ARKEcosystem/core/pull/2360
[#2370]: https://github.com/ARKEcosystem/core/pull/2370
[#2375]: https://github.com/ARKEcosystem/core/pull/2375
[#2376]: https://github.com/ARKEcosystem/core/pull/2376
[#2377]: https://github.com/ARKEcosystem/core/pull/2377
[#2379]: https://github.com/ARKEcosystem/core/pull/2379
[#2388]: https://github.com/ARKEcosystem/core/pull/2388
[#2391]: https://github.com/ARKEcosystem/core/pull/2391
[#2393]: https://github.com/ARKEcosystem/core/pull/2393
[#2394]: https://github.com/ARKEcosystem/core/pull/2394
[#2404]: https://github.com/ARKEcosystem/core/pull/2404
[#2405]: https://github.com/ARKEcosystem/core/pull/2405
[#2416]: https://github.com/ARKEcosystem/core/pull/2416
[#2417]: https://github.com/ARKEcosystem/core/pull/2417
[#2424]: https://github.com/ARKEcosystem/core/pull/2424
[#2425]: https://github.com/ARKEcosystem/core/pull/2425
[#2426]: https://github.com/ARKEcosystem/core/pull/2426
[#2429]: https://github.com/ARKEcosystem/core/pull/2429
[#2433]: https://github.com/ARKEcosystem/core/pull/2433
[#2437]: https://github.com/ARKEcosystem/core/pull/2437
[#2440]: https://github.com/ARKEcosystem/core/pull/2440
[#2443]: https://github.com/ARKEcosystem/core/pull/2443
[#2444]: https://github.com/ARKEcosystem/core/pull/2444
[#2458]: https://github.com/ARKEcosystem/core/pull/2458
[#2459]: https://github.com/ARKEcosystem/core/pull/2459
[#2461]: https://github.com/ARKEcosystem/core/pull/2461
[#2462]: https://github.com/ARKEcosystem/core/pull/2462
[#2464]: https://github.com/ARKEcosystem/core/pull/2464
[#2467]: https://github.com/ARKEcosystem/core/pull/2467
[#2468]: https://github.com/ARKEcosystem/core/pull/2468
[#2471]: https://github.com/ARKEcosystem/core/pull/2471
[#2473]: https://github.com/ARKEcosystem/core/pull/2473
[#2476]: https://github.com/ARKEcosystem/core/pull/2476
[#2479]: https://github.com/ARKEcosystem/core/pull/2479
[#2482]: https://github.com/ARKEcosystem/core/pull/2482
[#2484]: https://github.com/ARKEcosystem/core/pull/2484
[#2486]: https://github.com/ARKEcosystem/core/pull/2486
[#2487]: https://github.com/ARKEcosystem/core/pull/2487
[#2489]: https://github.com/ARKEcosystem/core/pull/2489
[#2491]: https://github.com/ARKEcosystem/core/pull/2491
[#2492]: https://github.com/ARKEcosystem/core/pull/2492
[#2495]: https://github.com/ARKEcosystem/core/pull/2495
[#2496]: https://github.com/ARKEcosystem/core/pull/2496
[#2499]: https://github.com/ARKEcosystem/core/pull/2499
[#2500]: https://github.com/ARKEcosystem/core/pull/2500
[#2502]: https://github.com/ARKEcosystem/core/pull/2502
[#2503]: https://github.com/ARKEcosystem/core/pull/2503
[#2506]: https://github.com/ARKEcosystem/core/pull/2506
[#2507]: https://github.com/ARKEcosystem/core/pull/2507
[#2513]: https://github.com/ARKEcosystem/core/pull/2513
[#2514]: https://github.com/ARKEcosystem/core/pull/2514
[#2515]: https://github.com/ARKEcosystem/core/pull/2515
[#2517]: https://github.com/ARKEcosystem/core/pull/2517
[#2522]: https://github.com/ARKEcosystem/core/pull/2522
[#2526]: https://github.com/ARKEcosystem/core/pull/2526
[#2528]: https://github.com/ARKEcosystem/core/pull/2528
[#2529]: https://github.com/ARKEcosystem/core/pull/2529
[#2539]: https://github.com/ARKEcosystem/core/pull/2539
[#2544]: https://github.com/ARKEcosystem/core/pull/2544
[#2552]: https://github.com/ARKEcosystem/core/pull/2552
[#2553]: https://github.com/ARKEcosystem/core/pull/2553
[#2555]: https://github.com/ARKEcosystem/core/pull/2555
[#2557]: https://github.com/ARKEcosystem/core/pull/2557
[#2558]: https://github.com/ARKEcosystem/core/pull/2558
[#2559]: https://github.com/ARKEcosystem/core/pull/2559
[#2560]: https://github.com/ARKEcosystem/core/pull/2560
[#2562]: https://github.com/ARKEcosystem/core/pull/2562
[#2563]: https://github.com/ARKEcosystem/core/pull/2563
[#2565]: https://github.com/ARKEcosystem/core/pull/2565
[#2567]: https://github.com/ARKEcosystem/core/pull/2567
[#2571]: https://github.com/ARKEcosystem/core/pull/2571
[#2574]: https://github.com/ARKEcosystem/core/pull/2574
[#2581]: https://github.com/ARKEcosystem/core/pull/2581
[#2582]: https://github.com/ARKEcosystem/core/pull/2582
[#2586]: https://github.com/ARKEcosystem/core/pull/2586
[#2590]: https://github.com/ARKEcosystem/core/pull/2590
[#2593]: https://github.com/ARKEcosystem/core/pull/2593
[#2597]: https://github.com/ARKEcosystem/core/pull/2597
[#2616]: https://github.com/ARKEcosystem/core/pull/2616
[#2618]: https://github.com/ARKEcosystem/core/pull/2618
[#2577]: https://github.com/ARKEcosystem/core/pull/2577
