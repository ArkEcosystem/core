# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Implement milestone hashes as peer info ([367442318d182ac23ad61e765e14f5d438ab472d])
-   Added a `milestoneHash` identifier to use for peer banning ([367442318d182ac23ad61e765e14f5d438ab472d])
-   Added TypeScript declarations for `core-logger` ([ef2d32182fafcec9842fddd8f1b54553ffdb27ba])
-   Added TypeScript declarations for `core-logger-winston` ([8dffbb7eef4001cc8315199799238dd081c4db59])
-   Added TypeScript declarations for `core-kernel` ([26374dfbd3deef21e53bcefdcb26f95d4eeb1739])
-   Added TypeScript declarations for `core-database` ([6466030d5bc08f40e6bdc8252d368520a2186c36], [c5a235b72e6f43c8ad768daddf26c1dea107a389])
-   Added TypeScript declarations for `core-transaction-pool` ([f8c4796d00290a294f53394ae6ebdc5d64377eac])
-   Added TypeScript declarations for `core-blockchain` ([12a6aa7cda7a5bb1d75448f09fe0305bced2cf75])
-   Added TypeScript declarations for `core-snapshots` ([72b1a0b707558af8407ad0408da5764e3ffe5178])
-   Added TypeScript declarations for `core-api` ([9d223c8ee2004fe35923d4b95b400afabde9cc14])
-   Added TypeScript declarations for `crypto` ([d7d74bcdfae55213e2b8962b76d228440fe2ab54])
-   Added the `core-jest-matchers` package ([b26ab9ce8cd29d4ae10a5f3ee0d47959e1ce0f65])
-   Added the `core-interfaces` package ([dfa38816dfff038abbd35cc23d948de32743e931])
-   Return the transaction expiration time via API ([18120a3a66c4755dc77aa6b750f8c1aabf082c2f])
-   Added the ability to disable the public API cache ([13bc930b91b0e130cf54115537e89c48008725bf])
-   Return the vote of a wallet via public API ([7d6125c2795847980c3ef3a32a49d2838658db72])

### Changed

-   Migrated from JavaScript to TypeScript ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Moved the `peers.json` configuration into `core-p2p` ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Merged `core-transaction-pool-mem` into `core-transaction-pool` ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Use a faster alternative to derive an estimate ([8fc955ae395e4256803d9b4081d4954ddc230987])
-   Reworked crypto configuration to make it simpler ([9a76d4c309054d33ece288303e3ac0635f8cfd34])
-   Moved the dynamic fees configuration into `core-transaction-pool` ([9a76d4c309054d33ece288303e3ac0635f8cfd34])
-   Periodically check for new peers instead of retrying until finding some ([e42f4c7894b7ce94c2915d844185b09bed27c171])
-   Adjusted some banning times for peers to make network recovery smoother ([08558a3b73afe441b8c62c73d1061bc10ca21a5e])
-   Simplified configuration by further separating network and core ([9a76d4c309054d33ece288303e3ac0635f8cfd34])
-   Take the `minFeeBroadcast` value into account for fee statistics ([7df0e8cc051e91cd5e0622e7a8781b24b07a84bd])
-   Only allow vendor fields for type 0 and 6 transactions ([86a4a2f9d8c00475787d336ab7c204c8987eb1a6])
-   Improved the network quorum details and feedback ([c25967f9edb37742c01847e047ce047fa4d3ed87])
-   Only return errors when broadcast and pool fees are too low ([7d240d98c2d755f9af6c304d5469432e79fc2761])
-   Improved performance of BIP38 ([02467f38cd4f4336c22e91467908e03b79baef7d])
-   Cleaned up the logic of block processing ([39b6aa8802e3fe2236d39681351133157ff49c77])
-   Cleaned up the logic of serialise/deserialise in crypto ([5aa2731053262dfa71992d49d4ec9c1ec6ffb8e2])
-   Replaced all ARK naming with CORE ([a7e7cb6e0b9651375ca6910be98cf440ad62f9bc])
-   Use system paths for data and configuration ([9f7e0f450679613e8c1884b05314b3893fcf40a0])
-   Increased the maximum transaction age to 6 hours ([c3ad02dfd029a697a64f92bf6f6e60eaf85154a0])

### Fixed

-   Resolved an issue with the `resolveOptions` method that would result in options being resolved for plugins that are not registered in the container ([fad5a259b1b1c074e7cf35d8279371ac78a47062])
-   Malformed condition for filtering peers ([0c2319649f9304465bfc60140c77e45fa225e77a])
-   Use the correct pagination schema for the v2 public API ([9f320c4f9aa19960ba19b75a19882dfe8d56f238])
-   Ensure that delegate searches can handle undefined values ([8c9b32353552d1c81fce2ddb45f42e12b23cb905])
-   Mark semantically invalid versions as invalid overall ([aff9c159acdef85fa744f65abf83c1b6121fc815])
-   Ordering of delegates via public API ([2bb00da852f790441b5597e19706ef0f4e8161bd])
-   Handle webhooks that have no conditions ([9d06e550261fbac7babd15729bf5ef79a3a823a7])
-   Validate the network byte on transactions ([22e04afa92f0ef80d90b676e5b49ff8974205be3])
-   Use correct schemas for address, public key and username validation in the public API ([80e35a9fe4f0c05669e74cbe9ee3a825554bf215])
-   Populate the last block of all delegates ([6967e5b3c03a45a67aef860e1c6009cc2ab2a709])
-   Return the transaction forging timestamp instead of signing timestamp ([dfa2ac06a4c5d520b6bc61fd71470089901e23ef])
-   Mark cold wallets as not found in the legacy API ([7dcb256914283fb6008cc31979e794daf2de80a9])
-   A malformed condition that resulted in wrong peer lists ([a8aa729f64033a7a8bc1a7b25ea295055f3a3509])
-   Properly verify block slot timestamps ([5df5ba250e4eb04667c52e85b1c1fe24b146e7eb])

### Removed

-   Removed the `transactionsFromIds` P2P endpoint ([9900caa64317640f3d77287161e4b2465d081599])

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

-   Improved performance for block and transaction queries by adding more indices on critical columns ([d0ba6564de8098dabb3839217c87db7682dadef1], [81f414ae65b6cdab290cae085babba9b4366a7f9], [83a9641f2ec72b8d68c59c95c36fe8513a12e4ed])

### Fixed

-   Take milestones into account for supply calculations ([a6a6802bfbbde6bf203c372a3a094a83b19e8693])
-   Use the raw transaction data in `acceptChainedBlock` to avoid timestamp mismatches and second signature double spend errors ([867d9eab567d3945285f0af0392fba070bac12d5])
-   Return the correct peer count for the v2 public API ([b0e5772fa084c22039918dab1d5af5667c22a32e])

## [2.0.0] - 2018-12-03

### Changed

-   Initial Release

[unreleased]: https://github.com/ArkEcosystem/core/compare/2.0.15...develop
[2.1.0]: https://github.com/ArkEcosystem/core/compare/2.0.15...2.1.0
[2.0.15]: https://github.com/ArkEcosystem/core/compare/2.0.14...2.0.15
[2.0.14]: https://github.com/ArkEcosystem/core/compare/2.0.13...2.0.14
[2.0.13]: https://github.com/ArkEcosystem/core/compare/2.0.12...2.0.13
[2.0.12]: https://github.com/ArkEcosystem/core/compare/2.0.11...2.0.12
[2.0.11]: https://github.com/ArkEcosystem/core/compare/2.0.1...2.0.11
[2.0.1]: https://github.com/ArkEcosystem/core/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/ArkEcosystem/core/compare/0.1.1...2.0.0
[02467f38cd4f4336c22e91467908e03b79baef7d]: https://github.com/ArkEcosystem/core/commit/02467f38cd4f4336c22e91467908e03b79baef7d
[08558a3b73afe441b8c62c73d1061bc10ca21a5e]: https://github.com/ArkEcosystem/core/commit/08558a3b73afe441b8c62c73d1061bc10ca21a5e
[0c2319649f9304465bfc60140c77e45fa225e77a]: https://github.com/ArkEcosystem/core/commit/0c2319649f9304465bfc60140c77e45fa225e77a
[12a6aa7cda7a5bb1d75448f09fe0305bced2cf75]: https://github.com/ArkEcosystem/core/commit/12a6aa7cda7a5bb1d75448f09fe0305bced2cf75
[13bc930b91b0e130cf54115537e89c48008725bf]: https://github.com/ArkEcosystem/core/commit/13bc930b91b0e130cf54115537e89c48008725bf
[18120a3a66c4755dc77aa6b750f8c1aabf082c2f]: https://github.com/ArkEcosystem/core/commit/18120a3a66c4755dc77aa6b750f8c1aabf082c2f
[22e04afa92f0ef80d90b676e5b49ff8974205be3]: https://github.com/ArkEcosystem/core/commit/22e04afa92f0ef80d90b676e5b49ff8974205be3
[26374dfbd3deef21e53bcefdcb26f95d4eeb1739]: https://github.com/ArkEcosystem/core/commit/26374dfbd3deef21e53bcefdcb26f95d4eeb1739
[2bb00da852f790441b5597e19706ef0f4e8161bd]: https://github.com/ArkEcosystem/core/commit/2bb00da852f790441b5597e19706ef0f4e8161bd
[35dbb99b62b5a11bb4a21ec456b9093f15ad9522]: https://github.com/ArkEcosystem/core/commit/35dbb99b62b5a11bb4a21ec456b9093f15ad9522
[367442318d182ac23ad61e765e14f5d438ab472d]: https://github.com/ArkEcosystem/core/commit/367442318d182ac23ad61e765e14f5d438ab472d
[39b6aa8802e3fe2236d39681351133157ff49c77]: https://github.com/ArkEcosystem/core/commit/39b6aa8802e3fe2236d39681351133157ff49c77
[3a0b19bfdd93fc4634a0f1faa922756ea715dbbf]: https://github.com/ArkEcosystem/core/commit/3a0b19bfdd93fc4634a0f1faa922756ea715dbbf
[3d7baf961b23d5ba8757375096d15a2ea90367af]: https://github.com/ArkEcosystem/core/commit/3d7baf961b23d5ba8757375096d15a2ea90367af
[5aa2731053262dfa71992d49d4ec9c1ec6ffb8e2]: https://github.com/ArkEcosystem/core/commit/5aa2731053262dfa71992d49d4ec9c1ec6ffb8e2
[5df5ba250e4eb04667c52e85b1c1fe24b146e7eb]: https://github.com/ArkEcosystem/core/commit/5df5ba250e4eb04667c52e85b1c1fe24b146e7eb
[6466030d5bc08f40e6bdc8252d368520a2186c36]: https://github.com/ArkEcosystem/core/commit/6466030d5bc08f40e6bdc8252d368520a2186c36
[6967e5b3c03a45a67aef860e1c6009cc2ab2a709]: https://github.com/ArkEcosystem/core/commit/6967e5b3c03a45a67aef860e1c6009cc2ab2a709
[72b1a0b707558af8407ad0408da5764e3ffe5178]: https://github.com/ArkEcosystem/core/commit/72b1a0b707558af8407ad0408da5764e3ffe5178
[75328312cfcb3047a3908122a82795634f0fcc79]: https://github.com/ArkEcosystem/core/commit/75328312cfcb3047a3908122a82795634f0fcc79
[7d240d98c2d755f9af6c304d5469432e79fc2761]: https://github.com/ArkEcosystem/core/commit/7d240d98c2d755f9af6c304d5469432e79fc2761
[7d6125c2795847980c3ef3a32a49d2838658db72]: https://github.com/ArkEcosystem/core/commit/7d6125c2795847980c3ef3a32a49d2838658db72
[7dcb256914283fb6008cc31979e794daf2de80a9]: https://github.com/ArkEcosystem/core/commit/7dcb256914283fb6008cc31979e794daf2de80a9
[7df0e8cc051e91cd5e0622e7a8781b24b07a84bd]: https://github.com/ArkEcosystem/core/commit/7df0e8cc051e91cd5e0622e7a8781b24b07a84bd
[80e35a9fe4f0c05669e74cbe9ee3a825554bf215]: https://github.com/ArkEcosystem/core/commit/80e35a9fe4f0c05669e74cbe9ee3a825554bf215
[81f414ae65b6cdab290cae085babba9b4366a7f9]: https://github.com/ArkEcosystem/core/commit/81f414ae65b6cdab290cae085babba9b4366a7f9
[81f414ae65b6cdab290cae085babba9b4366a7f9]: https://github.com/ArkEcosystem/core/commit/81f414ae65b6cdab290cae085babba9b4366a7f9
[83a9641f2ec72b8d68c59c95c36fe8513a12e4ed]: https://github.com/ArkEcosystem/core/commit/83a9641f2ec72b8d68c59c95c36fe8513a12e4ed
[867d9eab567d3945285f0af0392fba070bac12d5]: https://github.com/ArkEcosystem/core/commit/867d9eab567d3945285f0af0392fba070bac12d5
[86a4a2f9d8c00475787d336ab7c204c8987eb1a6]: https://github.com/ArkEcosystem/core/commit/86a4a2f9d8c00475787d336ab7c204c8987eb1a6
[8c9b32353552d1c81fce2ddb45f42e12b23cb905]: https://github.com/ArkEcosystem/core/commit/8c9b32353552d1c81fce2ddb45f42e12b23cb905
[8dffbb7eef4001cc8315199799238dd081c4db59]: https://github.com/ArkEcosystem/core/commit/8dffbb7eef4001cc8315199799238dd081c4db59
[8fc955ae395e4256803d9b4081d4954ddc230987]: https://github.com/ArkEcosystem/core/commit/8fc955ae395e4256803d9b4081d4954ddc230987
[97c25727f7a012f6db803e7191c1901098d628de]: https://github.com/ArkEcosystem/core/commit/97c25727f7a012f6db803e7191c1901098d628de
[97c387661ae2718f986ddd06b072fc6cbcdb50f1]: https://github.com/ArkEcosystem/core/commit/97c387661ae2718f986ddd06b072fc6cbcdb50f1
[9900caa64317640f3d77287161e4b2465d081599]: https://github.com/ArkEcosystem/core/commit/9900caa64317640f3d77287161e4b2465d081599
[9a76d4c309054d33ece288303e3ac0635f8cfd34]: https://github.com/ArkEcosystem/core/commit/9a76d4c309054d33ece288303e3ac0635f8cfd34
[9d06e550261fbac7babd15729bf5ef79a3a823a7]: https://github.com/ArkEcosystem/core/commit/9d06e550261fbac7babd15729bf5ef79a3a823a7
[9d223c8ee2004fe35923d4b95b400afabde9cc14]: https://github.com/ArkEcosystem/core/commit/9d223c8ee2004fe35923d4b95b400afabde9cc14
[9f320c4f9aa19960ba19b75a19882dfe8d56f238]: https://github.com/ArkEcosystem/core/commit/9f320c4f9aa19960ba19b75a19882dfe8d56f238
[9f7e0f450679613e8c1884b05314b3893fcf40a0]: https://github.com/ArkEcosystem/core/commit/9f7e0f450679613e8c1884b05314b3893fcf40a0
[a3c70fb5f575c95e9c9666c581b76b992683df17]: https://github.com/ArkEcosystem/core/commit/a3c70fb5f575c95e9c9666c581b76b992683df17
[a6a6802bfbbde6bf203c372a3a094a83b19e8693]: https://github.com/ArkEcosystem/core/commit/a6a6802bfbbde6bf203c372a3a094a83b19e8693
[a7e7cb6e0b9651375ca6910be98cf440ad62f9bc]: https://github.com/ArkEcosystem/core/commit/a7e7cb6e0b9651375ca6910be98cf440ad62f9bc
[a8aa729f64033a7a8bc1a7b25ea295055f3a3509]: https://github.com/ArkEcosystem/core/commit/a8aa729f64033a7a8bc1a7b25ea295055f3a3509
[aff9c159acdef85fa744f65abf83c1b6121fc815]: https://github.com/ArkEcosystem/core/commit/aff9c159acdef85fa744f65abf83c1b6121fc815
[b0e5772fa084c22039918dab1d5af5667c22a32e]: https://github.com/ArkEcosystem/core/commit/b0e5772fa084c22039918dab1d5af5667c22a32e
[b26ab9ce8cd29d4ae10a5f3ee0d47959e1ce0f65]: https://github.com/ArkEcosystem/core/commit/b26ab9ce8cd29d4ae10a5f3ee0d47959e1ce0f65
[b4e4d5661d8afd5d743d933a9f636459b52aecb3]: https://github.com/ArkEcosystem/core/commit/b4e4d5661d8afd5d743d933a9f636459b52aecb3
[c25967f9edb37742c01847e047ce047fa4d3ed87]: https://github.com/ArkEcosystem/core/commit/c25967f9edb37742c01847e047ce047fa4d3ed87
[c3ad02dfd029a697a64f92bf6f6e60eaf85154a0]: https://github.com/ArkEcosystem/core/commit/c3ad02dfd029a697a64f92bf6f6e60eaf85154a0
[c5a235b72e6f43c8ad768daddf26c1dea107a389]: https://github.com/ArkEcosystem/core/commit/c5a235b72e6f43c8ad768daddf26c1dea107a389
[c91254666922213f8a9608447ecd6b6e2ca692cb]: https://github.com/ArkEcosystem/core/commit/c91254666922213f8a9608447ecd6b6e2ca692cb
[d0ba6564de8098dabb3839217c87db7682dadef1]: https://github.com/ArkEcosystem/core/commit/d0ba6564de8098dabb3839217c87db7682dadef1
[d0ba6564de8098dabb3839217c87db7682dadef1]: https://github.com/ArkEcosystem/core/commit/d0ba6564de8098dabb3839217c87db7682dadef1
[d7d74bcdfae55213e2b8962b76d228440fe2ab54]: https://github.com/ArkEcosystem/core/commit/d7d74bcdfae55213e2b8962b76d228440fe2ab54
[dfa2ac06a4c5d520b6bc61fd71470089901e23ef]: https://github.com/ArkEcosystem/core/commit/dfa2ac06a4c5d520b6bc61fd71470089901e23ef
[dfa38816dfff038abbd35cc23d948de32743e931]: https://github.com/ArkEcosystem/core/commit/dfa38816dfff038abbd35cc23d948de32743e931
[e42f4c7894b7ce94c2915d844185b09bed27c171]: https://github.com/ArkEcosystem/core/commit/e42f4c7894b7ce94c2915d844185b09bed27c171
[ef2d32182fafcec9842fddd8f1b54553ffdb27ba]: https://github.com/ArkEcosystem/core/commit/ef2d32182fafcec9842fddd8f1b54553ffdb27ba
[f2b8ba5f36a6872ace2e2f7ea75b6fbdeb0e47fb]: https://github.com/ArkEcosystem/core/commit/f2b8ba5f36a6872ace2e2f7ea75b6fbdeb0e47fb
[f8c4796d00290a294f53394ae6ebdc5d64377eac]: https://github.com/ArkEcosystem/core/commit/f8c4796d00290a294f53394ae6ebdc5d64377eac
[fad5a259b1b1c074e7cf35d8279371ac78a47062]: https://github.com/ArkEcosystem/core/commit/fad5a259b1b1c074e7cf35d8279371ac78a47062
