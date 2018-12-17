# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

-   Migrated from JavaScript to TypeScript ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Moved the `peers.json` configuration into `core-p2p` ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Merged `core-transaction-pool-mem` into `core-transaction-pool` ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Use a faster alternative to derive an estimate ([8fc955ae395e4256803d9b4081d4954ddc230987])

### Fixed

-   Resolved an issue with the `resolveOptions` method that would result in options being resolved for plugins that are not registered in the container ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Malformed condition for filtering peers ([0c2319649f9304465bfc60140c77e45fa225e77a])
-   Use the correct pagination schema for the v2 public API ([9f320c4f9aa19960ba19b75a19882dfe8d56f238])

## [2.0.15] - 2018-12-11

### Fixed

-   Ensure no local peers are enlisted and that the IP of the TCP connection is used ([a3c70fb5f575c95e9c9666c581b76b992683df17])

## [2.0.14] - 2018-12-10

### Fixed

-   Reset last downloaded block when block is discarded ([3d7baf961b23d5ba8757375096d15a2ea90367af])

## [2.0.13] - 2018-12-07

### Fixed

-   Ensure safe integer range for block height lookups via API ([97c25727f7a012f6db803e7191c1901098d628de])

## [2.0.12] - 2018-12-06

### Fixed

-   Perform second-signature checks in the `canApply` logic of multi-signatures ([97c387661ae2718f986ddd06b072fc6cbcdb50f1])
-   return the encoded WIF for BIP38 wallets instead of the encrypted WIF ([3a0b19bfdd93fc4634a0f1faa922756ea715dbbf])

## [2.0.11] - 2018-12-05

### Added

-   Store executed migrations in the database ([b4e4d5661d8afd5d743d933a9f636459b52aecb3])

### Changed

-   Increase cache generation timeout and make it configurable ([f2b8ba5f36a6872ace2e2f7ea75b6fbdeb0e47fb], [75328312cfcb3047a3908122a82795634f0fcc79])

## [2.0.1] - 2018-12-05

### Added

-   Retrieve blocks via height or ID per public API ([c91254666922213f8a9608447ecd6b6e2ca692cb])

### Changed

-   Improved performance for block and transaction queries by adding more indices on critical columns (d0ba6564de8098dabb3839217c87db7682dadef1, 81f414ae65b6cdab290cae085babba9b4366a7f9, [83a9641f2ec72b8d68c59c95c36fe8513a12e4ed])

### Fixed

-   Take milestones into account for supply calculations ([a6a6802bfbbde6bf203c372a3a094a83b19e8693])
-   Use the raw transaction data in `acceptChainedBlock` to avoid timestamp mismatches and second signature double spend errors ([867d9eab567d3945285f0af0392fba070bac12d5])
-   Return the correct peer count for the v2 public API ([b0e5772fa084c22039918dab1d5af5667c22a32e])

## [2.0.0] - 2018-12-03

### Changed

-   Initial Release

[unreleased]: https://github.com/ArkEcosystem/core/compare/2.0.15...develop
[2.0.15]: https://github.com/ArkEcosystem/core/compare/2.0.14...2.0.15
[2.0.14]: https://github.com/ArkEcosystem/core/compare/2.0.13...2.0.14
[2.0.13]: https://github.com/ArkEcosystem/core/compare/2.0.12...2.0.13
[2.0.12]: https://github.com/ArkEcosystem/core/compare/2.0.11...2.0.12
[2.0.11]: https://github.com/ArkEcosystem/core/compare/2.0.1...2.0.11
[2.0.1]: https://github.com/ArkEcosystem/core/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/ArkEcosystem/core/compare/0.1.1...2.0.0
[0c2319649f9304465bfc60140c77e45fa225e77a]: https://github.com/ArkEcosystem/core/commit/0c2319649f9304465bfc60140c77e45fa225e77a
[3a0b19bfdd93fc4634a0f1faa922756ea715dbbf]: https://github.com/ArkEcosystem/core/commit/3a0b19bfdd93fc4634a0f1faa922756ea715dbbf
[3d7baf961b23d5ba8757375096d15a2ea90367af]: https://github.com/ArkEcosystem/core/commit/3d7baf961b23d5ba8757375096d15a2ea90367af
[75328312cfcb3047a3908122a82795634f0fcc79]: https://github.com/ArkEcosystem/core/commit/75328312cfcb3047a3908122a82795634f0fcc79
[81f414ae65b6cdab290cae085babba9b4366a7f9]: https://github.com/ArkEcosystem/core/commit/81f414ae65b6cdab290cae085babba9b4366a7f9
[83a9641f2ec72b8d68c59c95c36fe8513a12e4ed]: https://github.com/ArkEcosystem/core/commit/83a9641f2ec72b8d68c59c95c36fe8513a12e4ed
[867d9eab567d3945285f0af0392fba070bac12d5]: https://github.com/ArkEcosystem/core/commit/867d9eab567d3945285f0af0392fba070bac12d5
[8fc955ae395e4256803d9b4081d4954ddc230987]: https://github.com/ArkEcosystem/core/commit/8fc955ae395e4256803d9b4081d4954ddc230987
[97c25727f7a012f6db803e7191c1901098d628de]: https://github.com/ArkEcosystem/core/commit/97c25727f7a012f6db803e7191c1901098d628de
[97c387661ae2718f986ddd06b072fc6cbcdb50f1]: https://github.com/ArkEcosystem/core/commit/97c387661ae2718f986ddd06b072fc6cbcdb50f1
[9f320c4f9aa19960ba19b75a19882dfe8d56f238]: https://github.com/ArkEcosystem/core/commit/9f320c4f9aa19960ba19b75a19882dfe8d56f238
[a3c70fb5f575c95e9c9666c581b76b992683df17]: https://github.com/ArkEcosystem/core/commit/a3c70fb5f575c95e9c9666c581b76b992683df17
[a6a6802bfbbde6bf203c372a3a094a83b19e8693]: https://github.com/ArkEcosystem/core/commit/a6a6802bfbbde6bf203c372a3a094a83b19e8693
[b0e5772fa084c22039918dab1d5af5667c22a32e]: https://github.com/ArkEcosystem/core/commit/b0e5772fa084c22039918dab1d5af5667c22a32e
[b4e4d5661d8afd5d743d933a9f636459b52aecb3]: https://github.com/ArkEcosystem/core/commit/b4e4d5661d8afd5d743d933a9f636459b52aecb3
[c91254666922213f8a9608447ecd6b6e2ca692cb]: https://github.com/ArkEcosystem/core/commit/c91254666922213f8a9608447ecd6b6e2ca692cb
[d0ba6564de8098dabb3839217c87db7682dadef1]: https://github.com/ArkEcosystem/core/commit/d0ba6564de8098dabb3839217c87db7682dadef1
[f2b8ba5f36a6872ace2e2f7ea75b6fbdeb0e47fb]: https://github.com/ArkEcosystem/core/commit/f2b8ba5f36a6872ace2e2f7ea75b6fbdeb0e47fb
[fad5a259b1b1c074e7cf35d8279371ac78a47062]: https://github.com/ArkEcosystem/core/commit/fad5a259b1b1c074e7cf35d8279371ac78a47062
