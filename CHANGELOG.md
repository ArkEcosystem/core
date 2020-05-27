3667# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.6.38] - 2020-05-27

### Fixed

-   Discard late-forged blocks from forger ([#3746])

## [2.6.37] - 2020-05-12

### Changed

-   Custom validation for `postBlock` in `core-p2p` worker ([#3695])

## [2.6.36] - 2020-05-04

### Fixed

-   Update vote balance with htlc locked balance on vote transactions ([#3669])
-   Use sorted array (instead of tree) for storing transactions by fee and nonce ([#3678])

## [2.6.34] - 2020-04-28

### Fixed

-   Create a unique round ID for elasticsearch ([#3659])

### Changed

-   Update @arkecosystem/utils dependency ([#3665])
-   Use tree memory structure to sort by fee and by sender nonce **(core-transaction-pool)** ([#3667])

## [2.6.31] - 2020-03-25

### Fixed

-   Allow transition to fork from idle ([#3614])

## [2.6.30] - 2020-03-19

### Changed

-   Optimize database adding indexes ([#3605])
-   Restrict some api sorting and filtering parameters that are not needed ([#3605])

## [2.6.29] - 2020-03-13

Re-release for NPM.

## [2.6.28] - 2020-03-13

### Changed

-   Reset missedBlocks before await call ([#3598])

## [2.6.27] - 2020-03-12

### Fixed

-   Always apply to sender wallet on `acceptChainedBlock` ([#3594])
-   Block incomplete sockets ([#3596])

## [2.6.25] - 2020-03-09

### Fixed

Fix block apply issue where in some cases transaction could be applied twice to recipient in transaction pool ([#3590])

## [2.6.24] - 2020-03-04

### Fixed

-   add missing transactions.type_group index ([#3573])

### Changed

-   update xstate to v4.8.0 ([#3575])
-   use application events from core-event-emitter ([#3574])

## [2.6.21] - 2020-03-04

### Fixed

-   Set height 1 on config manager for processing genesis block (blockchain replay) ([#3561])
-   Handle multiple installations of jemalloc ([#3562])
-   jemalloc compatibility for ubuntu 16.04 ([#3567])
-   Always call applyToRecipient ([#3570])

### Changed

-   Allow multiple ports in bridgechain schema ([#3504])
-   Allow to resign business only when bridgechains are resigned ([#3524])
-   Make bridgechain genesis hash only unique per wallet ([#3523])
-   Add exceptions for business resignation ([#3551])
-   No default addonBytes for magistrate transactions ([#3560])
-   Use jemalloc as the memory allocator ([#3541])

## [2.6.11] - 2020-02-26

### Fixed

-   Only accept valid http path (SC http server) ([#3537])

## [2.6.10] - 2020-02-20

### Fixed

-   Disable permessage-deflate ([#3518])

## [2.6.9] - 2020-02-19

### Added

-   Filter peers by version range ([#3465])
-   Add flag to skip export of rolled back transactions ([#3459])

### Fixed

-   Check for missed blocks before applying round ([#3507])
-   Make app.js optional as initially intended ([#3510])
-   Multisig legacy allow signatures property ([#3489])

### Changed

-   Remove pm2 from docker ([#3505])
-   Use findByPublicKey to set both publickey and address on the multisig wallet ([#3498])
-   Remove long dependency ([#3502])

## [2.6.1] - 2020-02-11

### Changed

-   Update `@arkecosystem/exchange-json-rpc`

## [2.6.0] - 2020-02-11

### Added

-   Expose `isValidPeer` via ajv format rule ([#2960])
-   Implement AIP 102 ([#2773])
-   Implement AIP 103 ([#2858])
-   Implement MultiPayment (AIP11) ([#2669])
-   Implement nonces ([#2573])
-   Multi Signature support for WIF ([#2979])
-   Transaction type dependencies ([#2859])
-   Add nonce to wallet transformer ([#2760])
-   Allow easy retrieval of first and last block ([#2641])
-   Allow retrieval of raw blocks and transactions ([#2616])
-   Endpoints for locks/businesses/bridgechains ([#2940])
-   Find htlc unlock transactions ([#2976])
-   Include core version in node/configuration ([#2855])
-   Search transactions by asset ([#2618])
-   Enforce transactions' nonce order from blockProcessor ([#2873])
-   Change minimum version via milestone ([#2869])
-   Use compression on the p2p level ([#2886])
-   Add support for transaction nonces ([#2925])
-   Attributes getter/setter for wallet ([#2839])
-   Wallet Manager indexes ([#2845])
-   Register wallet attributes before accessing them ([#2867])
-   Allow CLI command configurations ([#2972])
-   Allow passing height to `configManager.isNewMilestone` ([#3001])
-   Expose transaction height, blockId and generatorPublicKey during bootstrap ([#3096])
-   Add `/transactions/schemas` endpoint ([#3083])
-   Implement businesses/bridgechains endpoint ([#3119])
-   Implement throttling on outgoing p2p communication ([#3170])
-   Implement Address.fromWIF method ([#3228])

### Fixed

-   Always deserialize vendor field ([b537d6f327e939ff40b680ea7d558e8fdb3ac921])
-   Basic validation on incoming p2p data + terminate socket on error ([#3037])
-   Clone webhook before mutating it ([#2863])
-   Delete existing payload processor db ([#2864])
-   Do not sort transactions in forger / update purgeByBlock logic for handling nonces ([#2678])
-   HTLC refund handler to use performGenericWalletChecks ([#2944])
-   Move wallet manager "zero balance" check to transaction handlers ([#2896])
-   Multipayment balance / vote balance ([#2838])
-   Range selection in pool's getTransactions() ([#2952])
-   `/wallets/{id}/transactions` search parameters ([#2923])
-   Return block timestamp for v2 transactions ([#2906])
-   Return count of filtered peers ([#2814])
-   Clear queue on invalid block ([#2897])
-   Do not reset `noBlockCounter` when `downloadBlocks` succeeds ([#2968])
-   Only shift milestoneHeights[] if at that height ([#2904])
-   Round deletion during rollback ([#2970])
-   Prefix table names with schema ([#2830])
-   Store vendor field in bytea ([#3048])
-   Add missing typeGroup and emit StateStarting ([#2932])
-   Use correct IV length for encryption ([#3036])
-   Disconnect if api reports different network ([#2909])
-   Don't cause suspensions for unresponsive plugins ([34749bf84bcec3fecd0098c0d42f52deb1f6ba4a])
-   Fix the genesis block id during verify ([#2809])
-   Export/import transactions type_group ([#2996])
-   Remove bogus skipRoundRows ([#2973])
-   `buildDelegateRanking` called too early ([#2921])
-   `buildVoteBalances` called too early ([#2920])
-   Differentiate between wallets and delegates ([#2854])
-   Index recipient wallets during bootstrap ([#2947])
-   Copy vote target into temp wallet manager ([1209a36366c8fd3ba31fab2463011b7ce1a7d844])
-   Sort by fee, nonce ([#2937])
-   Implement Delegate resignation ([#3045])
-   Reject delegate resignation if not enough active delegates ([#2919])
-   Update wallet nonce when applying v1 transaction ([#2959])
-   Use supply calculator in delegate approval calculation ([#2918])
-   Cast params in condition checks ([#2887])
-   Add legacy multisignature schema ([#3040])
-   Ensure only one signature per participant ([#2889])
-   Handle mainnet address exceptions ([#3055])
-   HTLC lock buffer allocation ([#2936])
-   Legacy multi signature verification ([#2898])
-   Run ajv validator again when encountering exceptions ([#3008])
-   Use `anyOf` for transactions schema ([#2894])
-   Use 2 bytes to store number of payments ([#2928])
-   Use strict comparison to decide if a transaction should be enabled ([#3087])
-   Include typeGroup in `/transactions/fees` and `/node/fees` endpoints ([#3193])
-   Add missing offset handling to /api/peers ([#3075])
-   Use numerics for typeGroups in /transactions/types ([#3112])
-   Add transactions back to pool only after reverting all blocks ([#3138])
-   Pass IBlockData to processBlocks instead of IBlock ([#3426])
-   Don't assume blocksInCurrentRound is defined ([#3341])
-   Set last height before initializing last block to use correct milestones ([#3109])
-   Don't swallow BIP38 errors ([#3271])
-   Use the request origin to avoid 404s ([#3071])
-   Raise `getCommonBlocks` rate limit ([#3069])
-   Return error when app is not ready ([#3171])
-   Uncaught IPC timeout ([#3140])
-   Support nonces and chunk transactions before broadcast ([#3081])
-   Create new wallet if not found ([#3086])
-   Wallet-manager fallback to database wallet manager findByIndex() when no "local" match ([#3256])
-   Throw if transaction key is already taken ([#3095])
-   Update sender's wallet after validation ([#3291])
-   Prevent snapshot commands from running if core is running ([#3196])
-   Remove password flag constraint for core:forger command ([#3270])
-   Properly implement block size limit ([#3154])
-   Strengthen schema validation checks ([#3062])

### Changed

-   Log the reason for discarding a block ([#2903])
-   Accept prerelease version ([#2911])
-   Add `round.missed` event ([#3011])
-   Do not temporary increment/decrement nonce when checking transaction validity ([#2587])
-   Increase transaction type size ([#2861])
-   Reject V1 transactions after milestone ([#2879])
-   Remove `vendorFieldHex` ([#3014])
-   Remove asset migration heuristic ([#2999])
-   Return all registered transaction types ([#2878])
-   Strengthen a nonce check in performGenericWalletChecks() ([#2949])
-   Add default transaction fees ([#2842])
-   Add `vendorField` and `timestamp` to `/locks` endpoint ([#3005])
-   Integrate hapi-pagination to replace fork ([#2994])
-   Use pagination configuration limit ([032caa1b990e91937e4bc1561bc1aeaeca9e37d9])
-   Break loop if block contains v1 transaction ([#2914])
-   Add nonce column ([#2844])
-   Emit `forging.missing` earlier ([#2893])
-   Emit missing `transaction.reverted` event and remove obsolete ones ([#2895])
-   Cleanup socket errors ([#3056])
-   Increase network timeouts ([#2828])
-   Make peer reply errors less verbose ([#2962])
-   Share rate limiter between workers ([#2912])
-   Expose current block for transaction handlers ([#2856])
-   Clear cached transaction ids after accepting block ([#2916])
-   Don't accept expired v1 transactions ([#2948])
-   Bootstrap transactions in batches ([#2997])
-   Elaborate the unexpected nonce error ([#2943])
-   HTLC implementation ([#2915])
-   Make handler functions asynchronous ([#2865])
-   Use default heap size regardless of available memory ([#2998])
-   Change maximum recipients of multipayment via milestone ([#2961])
-   Export abstract builder for use by plugins ([#2721])
-   Fallback to ECDSA signature for version 2 transactions ([#2584])
-   Make error more verbose ([#2938])
-   Move base58 functions to utils ([#2675])
-   ECDSA Signature deserialization for v2 transactions ([#2877])
-   Remove unnecessary check from validateTransactions() ([#2951])
-   Fallback to core typegroup if querying by type ([#3147])
-   Integrate hapi-pagination to replace fork ([#3034])
-   Sort peers by height, latency ([#3078])
-   Add `stateBuilder.finished` to ApplicationEvents ([#3084])
-   Make deserializers static ([#3234])
-   Fix genesis and exception transactions cache ([#3296])
-   Overwrite arrays when merging milestones ([#3108])

### Performance

-   Avoid O(m\*n) when filtering pool txs and simplify the code ([#2941])
-   Ditch unnecessary reindex() in multi-payment bootstrap ([#3022])
-   Keep genesis block instance in-memory ([7a73aef8b29d40572d1524cf8b1bafbffa3b0964])
-   Use lodash to efficiently remove forged transactions ([#2942])
-   Add index on transactions.type ([#3043])
-   Speed up nonce checks at DB level ([#2910])
-   Make address network byte check part of serde ([#3000])
-   Memoize base58 de/encoding ([#3015])
-   Replace bignumber.js with native BigInt ([#3010])
-   Replace bs58check with bstring ([#2673])
-

## [2.5.38] - 2020-01-21

Rerelease of 2.5.37 due to some npm issues.

## [2.5.37] - 2020-01-21

### Fixed

-   Remove banning when peer opens multiple sockets ([#3409])

## [2.5.36] - 2020-01-21

### Fixed

-   Discard blocks containing too many transactions ([#3404])
-   Disconnect when multiple sockets are opened from same IP ([#3404])
-   Handle invalid WS opcodes ([#3404])
-   Disconnect for p2p SocketCluster events that do not have a handler ([#3404])
-   Handle payload with additional properties ([#3404])

## [2.5.31] - 2019-12-19

### Fixed

-   Handle disconnect packets ([#3354])

## [2.5.30] - 2019-12-09

### Fixed

-   Stricter p2p msg check + ip blocking ([#3331])
-   Purge ipLastError every hour ([#3331])

## [2.5.28] - 2019-11-05

### Fixed

-   Stricter WS/SC events/messages handling ([#3208])
-   Handle unwanted control frames ([#3208])

### Changed

-   Prepare for upcoming 2.6 release ([#3208])

## [2.5.26] - 2019-10-07

### Changed

-   Integrate hapi-pagination to replace fork ([#3030])

## [2.5.25] - 2019-09-19

### Fixed

-   Terminate connection when not authorized ([#2945])

## [2.5.24] - 2019-09-04

### Fixed

-   Cast params in webhook condition checks ([#2887])
-   Drop connections with malformed messages ([#2907])
-   Terminate blocked client connections ([#2907])
-   Use `anyOf` for transactions schema ([#2894])
-   Use compression on the p2p level ([#2886])

## [2.5.17] - 2019-08-06

### Fixed

-   Differentiate between wallets and delegates ([#2854])
-   Clone webhook before mutating it ([#2863])
-   Delete existing db ([#2864])

## [2.5.14] - 2019-07-30

### Fixed

-   Add content-type header for all requests ([#2840])
-   Return data directly if cache is disabled in `core-api` ([#2831])
-   Internal server error caused by invalid orderBy field in `core-api` ([#2847])
-   Peer discovery limit ([#2850])

### Changed

-   Lookup delegates by key to improve performance ([#2837])
-   Add ntp and google servers for ntpd to docker image ([#2823])
-   Improve performance of transactions endpoint in `core-p2p` ([#2848])

## [2.5.7] - 2019-07-16

### Fixed

-   Accepted versions ([#2802])
-   Fix the genesis block id during verification of snapshots ([#2809])
-   Average fee and wallet transaction retrieval in `@arkecosystem/core-exchange-json-rpc` ([1.0.3](https://github.com/ArkEcosystem/exchange-json-rpc/releases/tag/1.0.3))

### Changed

-   Export dist/index.js for cjs and umd in `@arkecosystem/crypto` ([#2807])
-   Update dependencies to their latest versions ([#2808])
-   Lookup wallets by keys for improved performance ([#2810])

## [2.5.1] - 2019-07-11

### Fixed

-   SSL functionality of core-api ([#2800])

## [2.5.0] - 2019-07-11

### Added

-   Allow retrieval of raw blocks and transactions via API ([#2616])
-   Search transactions by asset via API ([#2618])
-   Allow easy retrieval of first and last block ([#2641])
-   Make it configurable whether to use estimates for `core-api` ([#2772])

### Fixed

-   Impose the same rate limit as the public API ([#2717])
-   Add option to configure request timeouts for webhooks([#2710])
-   Use CORE_API_DISABLED variable in defaults ([#2711])
-   Always attempt to download blocks after start ([#2746])
-   Possible database corruption when writing and deleting blocks ([#2707])
-   Forget peer when socket is disconnected ([#2720])
-   Off-by-one error when fetching blocks from peer ([#2733])
-   Check for user confirmation in snapshot commands ([#2734])
-   Grant access if the whitelist is empty ([#2748])
-   Do not purge transactions when a block is not accepted ([#2751])
-   Previous round order calculation ([#2754])
-   Revert accepted blocks when saveBlocks fails ([#2761])
-   Do not restore genesis block with wrong id ([#2759])
-   Dvoid iterating on non-iterable peerBlocks ([#2763])
-   Correct estimate if less than limit rows ([#2764])
-   Try harder to return the requested number of transactions ([#2765])
-   Reject future and expired transaction timestamps ([#2757])
-   Delete last block if deserialization fails ([#2770])
-   Raise bignumber maximum ([#2777])
-   Allow future timestamps up to 3600 + blocktime seconds ([#2787])
-   Handle null url and malformed JSON payloads ([#2797])

### Changed

-   **BREAKING:** Treat and return BigInt values as strings _(affects core-api)_ ([#2739])
-   Download serialized blocks to improve performance ([#2743])
-   Better peer block header check to improve performance ([#2719])
-   Exit on unexpected database errors ([#2744], [#2755])
-   Block peers when the rate limit is exceeded ([#2745])
-   Delay peer discovery until after state initialization is done ([#2727])
-   Improved P2P rate limiting ([#2729])
-   Only fetch block headers when verifying peers ([#2728])
-   Only look for new peers when below minimum peers ([#2714])
-   Always keep the Wallet API enabled ([#2715])
-   Respect the whitelist of the public API ([#2718])
-   Add foreign key on transactions block id ([#2671])
-   Remove the id column from rounds ([#2723])
-   Discover new peers sooner ([#2771])
-   Enforce chained blocks at database level ([#2753])
-   Increase timeout, check time left in slot ([#2788])
-   Refresh peer ports ([#2784])
-   Remove blockSender ([#2756])

### Removed

-   Removed the `ark-node` legacy API known as `v1` ([#2577])

## [2.4.15] - 2019-07-09

-   Backport various bug fixes from 2.5 ([#2782])

## [2.4.14] - 2019-07-02

### Fixed

-   Try harder to return the requested number of transactions ([#2766])

## [2.4.13] - 2019-06-26

### Changed

-   Do not purge transactions when a block is not accepted ([#2751])

## [2.4.12] - 2019-06-14

### Changed

-   Cache genesis transaction ids for improved performance ([#2699])

### Fixed

-   Take milestones into account when downloading blocks in parallel ([#2700])

## [2.4.1] - 2019-06-13

### Fixed

-   Use SQL to calculate fee statistics ([#2692])
-   Increase rate limit to handle bigger networks ([#2482])

## [2.4.0] - 2019-06-12

All changes listed in this section are things that either alter how certain data in core is treated and processed or changes to the public API of a package.

As we move towards 2.6 and the completion of AIP11, AIP18 and AIP29 there will be various breaking changes. The main concern of most developers will be breaking changes to `@arkecosystem/crypto` so go through the commits listed below and make sure you adjust everything in your application that is affected by a change.

### Exchange JSON-RPC

The JSON-RPC we offer, formerly known as `@arkecosystem/core-json-rpc`, has received a rework to turn it into a real RPC that is easier to use and maintain.

#### Programmatic

The biggest change is that it now offers programmatic use to make integration into ARK Core easier while simultaneously allowing it to run as a standalone application detached from a relay.

**Standalone**
https://github.com/ArkEcosystem/exchange-json-rpc

**ARK Core Plugin**
https://github.com/ArkEcosystem/core/tree/develop/packages/core-exchange-json-rpc

> The `@arkecosystem/core-json-rpc` plugin has been deprecated and replaced by `@arkecosystem/core-exchange-json-rpc` because of different those 2 plugins work under the hood and their dependencies.

#### Peers

A few smaller improvements to how peers and faulty responses are being handled have also been made which should smoothen the experience without having to manually retry requests.

#### Database

The Exchange JSON-RPC uses SQLite under the hood to store all data. In previous versions it was using https://github.com/mapbox/node-sqlite3 which was known to cause random build issues for ARK Core and sometimes needed a dozen retries before it finally compiled.

That dependency has been replaced with https://github.com/JoshuaWise/better-sqlite3 which is the same that ARK Core uses for its transaction pool. It provides better performance, receives updates and fixes when needed and build errors are a thing of the past.

#### Migration

If you've been using the JSON-RPC in the past together with ARK Core the migration to the Exchange JSON-RPC is as simple as following the steps at https://docs.ark.io/releases/v2.4/migrating_2.3_2.4.html#step-5-update-core-json-rpc-to-core-exchange-json-rpc.

#### Disclaimer

1. The Exchange JSON-RPC is only maintained for exchanges, as the name suggests. We do not offer any support or guidance unless you are an Exchange in which case you most likely will already be in touch with us.
2. Do not use the Exchange JSON-RPC unless you are forced too and have no other options. The Public API provides much greater capabilities of searching and filtering data.

### Added

-   Implement in `@arkecosystem/core-state` to manage the state of in-memory data ([#2479])
-   Implement a blockchain replay command ([#2526])
-   Save blocks in batches during sync ([#2500])
-   Implement v2/node/fees endpoint ([#2393])
-   Allow setting a vendor field for transactions created via `@arkecosystem/core-json-rpc` ([#2425])
-   Limit the number of accepted peers per subnet ([#2507])
-   **BREAKING:** Implement WebSockets with SocketCluster ([#2273])
-   Parallel block download ([#2433])
-   In-memory storage for last N blocks and transactions ([#2492])
-   **BREAKING:** Switch transaction expiration from seconds to chain height ([#2461])
-   Require the user to choose a snapshot if the blocks flag is missing in `@arkecosystem/core` commands ([#2522])
-   **BREAKING:** Implement Block.fromHex, Block.fromBytes and Block.fromData methods in `@arkecosystem/crypto` ([#2377])
-   **BREAKING:** Implement BlockFactory in `@arkecosystem/crypto` ([#2429])
-   **BREAKING:** Implement TransactionFactory in `@arkecosystem/crypto` ([#2437])
-   Integrate end-to-end tests ([#2468])
-   Initial Implementation of `core-wallet-api` ([#2544])
-   Accept block height to list block transactions in `core-api` ([#2567])
-   Functional test matchers for `core-jest-matchers` ([#2562])
-   Don't trust headers and verify config and plugin connectivity of peers ([#2559], [#2553], [#2552])
-   Proxy API calls to core-api until fully developed ([#2558])
-   Add database configuration command to CLI ([#2557], [#2563])
-   Add command to generate network configuration CLI ([#2582])
-   Initial implementation of `core-explorer` ([#2604])

### Fixed

-   Insert the genesis block as soon as the database is ready ([#2376])
-   **BREAKING:** Purge invalid transactions after a milestone change ([#2499])
-   Use public API to auto-configure `@arkecosystem/core-tester-cli` ([#2517])
-   Parse only the last line of pm2 stdout to avoid parsing faulty input ([#2484])
-   Delete bad rounds after unclean shutdown ([#2581])
-   Divide blocks into smaller chunks for batch processing ([#2586])
-   Remove forged transactions from pool before discarding block ([#2555])
-   **BREAKING:** Make transaction amount required ([#2574])
-   Various sync issues with devnet and mainnet ([#2565])
-   Do not suspend peer for `AppNotReady` ([#2590])
-   Allow use of old and new block IDs via `core-json-rpc` ([#2593])
-   Assign calculated delegate ranks from temp wallets to prevent wrong ranks on boot ([#2611])
-   Camelize block keys before bignum transformation for snapshots ([#2615])
-   Deserialize transactions before they leave the pool to remove bad ones ([#2622])
-   Require all properties in schema and handle 404 resources for `core-webhooks` ([#2634])
-   Check if transactions can still be applied before forging ([#2635])
-   Off by one error in transaction confirmations via API ([#2645])
-   Set the correct channel if core was directly installed with `@next` ([#2646])
-   Invalid orderBy causes `Internal Server Error` via API ([#2653)
-   Avoid trying to INSERT duplicates in rounds via `core-snapshots` ([#2651])
-   Handle failing optional plugins gracefully ([#2657])
-   Correctly purge invalid transactions from disk on start ([#2665])
-   Don't append duplicate rounds rows to a snapshot ([#2662])
-   Use temporary wallets for transaction validation ([#2666])
-   Correctly display second signature if available via `core-api` ([#2670])
-   Missing block confirmations on v2 API endpoints ([#2674])
-   Delay transaction purge on start until after StateBuilder finished ([#2685])
-   Check claimed state of peer ([#2686])
-   Ignore overheight blocks and keep forging ([#2687])

### Changed

-   **BREAKING:** Always use crypto identities to work with keys and addresses ([#2443])
-   **BREAKING:** Enforce BigNumber for satoshi based values ([#2391])
-   **BREAKING:** Move in-memory wallet logic to core-state ([#2489])
-   **BREAKING:** Replace bignumify with Utils.BigNumber.make ([#2416])
-   Replace Joi with AJV for internal validation ([#2426])
-   **BREAKING:** Bind plugin options before registering the plugin ([#2375])
-   **BREAKING:** Extend the node.js event emitter ([#2440])
-   **BREAKING:** Move the wallet interfaces to `@arkecosystem/core-state` ([#2515])
-   Remove height difference ban for peers ([#2360])
-   **BREAKING:** Simplify the transaction pool by not using insertion order ([#2495])
-   **BREAKING:** Drop no longer needed pagination from `@arkecosystem/core-webhooks` ([#2424])
-   **BREAKING:** Extract transaction signing and utils out of the model in `@arkecosystem/crypto` ([#2514])
-   **BREAKING:** Extract transaction verification out of the model in `@arkecosystem/crypto` ([#2506])
-   **BREAKING:** Make all `Slots.*` methods static in `@arkecosystem/crypto` ([#2473])
-   **BREAKING:** Move interfaces, types and models in `@arkecosystem/crypto` ([#2379])
-   Move mainnet exceptions to config in `@arkecosystem/crypto` ([#2529])
-   **BREAKING:** Remove extraneous Client class in `@arkecosystem/crypto` ([#2417])
-   **BREAKING:** Split the `Crypto` class into `Hash` and `Transaction` in `@arkecosystem/crypto` ([#2444])
-   Invalidate blocks with expired transactions ([#2528])
-   Transaction type agnostic wallet bootstrap to support AIP29 ([#2539])
-   Return all schema errors in hapi-ajv ([#2571])
-   Remove timeout banning ([#2597])
-   Use dayjs as it now has official UTC support ([#2592])
-   Require a minimum of 0 as pubKeyHash ([#2628])
-   **BREAKING:** Replaced `@arkecosystem/core-json-rpc` with `@arkecosystem/core-exchange-json-rpc` _(Use `@arkecosystem/core-exchange-json-rpc` programmatically)_ ([#2643])
-   Expire transactions that don't have an expiration ([#2672])

### Removed

-   **BREAKING:** Remove unused methods to get/set/reset height from `Slots` ([#2467])
-   Remove peer caching ([#2606])
-   Remove peer banning ([#2612])
-   Remove coldstart period ([#2619])
-   Remove whitelist access log ([#2655])

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
-   Remove already forged transactions from the pool ([#2659])

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
[2.6.37]: https://github.com/ARKEcosystem/core/compare/2.6.36...2.6.37
[2.6.36]: https://github.com/ARKEcosystem/core/compare/2.6.34...2.6.36
[2.6.34]: https://github.com/ARKEcosystem/core/compare/2.6.31...2.6.34
[2.6.31]: https://github.com/ARKEcosystem/core/compare/2.6.30...2.6.31
[2.6.30]: https://github.com/ARKEcosystem/core/compare/2.6.29...2.6.30
[2.6.29]: https://github.com/ARKEcosystem/core/compare/2.6.28...2.6.29
[2.6.28]: https://github.com/ARKEcosystem/core/compare/2.6.27...2.6.28
[2.6.27]: https://github.com/ARKEcosystem/core/compare/2.6.25...2.6.27
[2.6.25]: https://github.com/ARKEcosystem/core/compare/2.6.24...2.6.25
[2.6.24]: https://github.com/ARKEcosystem/core/compare/2.6.21...2.6.24
[2.6.21]: https://github.com/ARKEcosystem/core/compare/2.6.11...2.6.21
[2.6.11]: https://github.com/ARKEcosystem/core/compare/2.6.10...2.6.11
[2.6.10]: https://github.com/ARKEcosystem/core/compare/2.6.9...2.6.10
[2.6.9]: https://github.com/ARKEcosystem/core/compare/2.6.1...2.6.9
[2.6.1]: https://github.com/ARKEcosystem/core/compare/2.6.0...2.6.1
[2.6.0]: https://github.com/ARKEcosystem/core/compare/2.5.38...2.6.0
[2.5.38]: https://github.com/ARKEcosystem/core/compare/2.5.37...2.5.38
[2.5.37]: https://github.com/ARKEcosystem/core/compare/2.5.36...2.5.37
[2.5.36]: https://github.com/ARKEcosystem/core/compare/2.5.31...2.5.36
[2.5.31]: https://github.com/ARKEcosystem/core/compare/2.5.30...2.5.31
[2.5.30]: https://github.com/ARKEcosystem/core/compare/2.5.28...2.5.30
[2.5.28]: https://github.com/ARKEcosystem/core/compare/2.5.26...2.5.28
[2.5.26]: https://github.com/ARKEcosystem/core/compare/2.5.25...2.5.26
[2.5.25]: https://github.com/ARKEcosystem/core/compare/2.5.24...2.5.25
[2.5.24]: https://github.com/ARKEcosystem/core/compare/2.5.19...2.5.24
[2.5.19]: https://github.com/ARKEcosystem/core/compare/2.5.17...2.5.19
[2.5.17]: https://github.com/ARKEcosystem/core/compare/2.5.14...2.5.17
[2.5.14]: https://github.com/ARKEcosystem/core/compare/2.5.7..2.5.14
[2.5.7]: https://github.com/ARKEcosystem/core/compare/2.5.1...2.5.7
[2.5.1]: https://github.com/ARKEcosystem/core/compare/2.5.0...2.5.1
[2.5.0]: https://github.com/ARKEcosystem/core/compare/2.4.14...2.5.0
[2.4.15]: https://github.com/ARKEcosystem/core/compare/2.4.14...2.4.15
[2.4.14]: https://github.com/ARKEcosystem/core/compare/2.4.13...2.4.14
[2.4.13]: https://github.com/ARKEcosystem/core/compare/2.4.12...2.4.13
[2.4.12]: https://github.com/ARKEcosystem/core/compare/2.4.1...2.4.12
[2.4.1]: https://github.com/ARKEcosystem/core/compare/2.4.0...2.4.1
[2.4.0]: https://github.com/ARKEcosystem/core/compare/2.3.23...2.4.0
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
[#2439]: https://github.com/ARKEcosystem/core/pull/2439
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
[#2562]: https://github.com/ARKEcosystem/core/pull/2562
[#2563]: https://github.com/ARKEcosystem/core/pull/2563
[#2565]: https://github.com/ARKEcosystem/core/pull/2565
[#2567]: https://github.com/ARKEcosystem/core/pull/2567
[#2571]: https://github.com/ARKEcosystem/core/pull/2571
[#2573]: https://github.com/ARKEcosystem/core/pull/2573
[#2574]: https://github.com/ARKEcosystem/core/pull/2574
[#2577]: https://github.com/ARKEcosystem/core/pull/2577
[#2578]: https://github.com/ARKEcosystem/core/pull/2578
[#2581]: https://github.com/ARKEcosystem/core/pull/2581
[#2582]: https://github.com/ARKEcosystem/core/pull/2582
[#2584]: https://github.com/ARKEcosystem/core/pull/2584
[#2586]: https://github.com/ARKEcosystem/core/pull/2586
[#2587]: https://github.com/ARKEcosystem/core/pull/2587
[#2590]: https://github.com/ARKEcosystem/core/pull/2590
[#2592]: https://github.com/ARKEcosystem/core/pull/2592
[#2593]: https://github.com/ARKEcosystem/core/pull/2593
[#2597]: https://github.com/ARKEcosystem/core/pull/2597
[#2604]: https://github.com/ARKEcosystem/core/pull/2604
[#2606]: https://github.com/ARKEcosystem/core/pull/2606
[#2611]: https://github.com/ARKEcosystem/core/pull/2611
[#2612]: https://github.com/ARKEcosystem/core/pull/2612
[#2615]: https://github.com/ARKEcosystem/core/pull/2615
[#2616]: https://github.com/ARKEcosystem/core/pull/2616
[#2618]: https://github.com/ARKEcosystem/core/pull/2618
[#2619]: https://github.com/ARKEcosystem/core/pull/2619
[#2622]: https://github.com/ARKEcosystem/core/pull/2622
[#2628]: https://github.com/ARKEcosystem/core/pull/2628
[#2634]: https://github.com/ARKEcosystem/core/pull/2634
[#2635]: https://github.com/ARKEcosystem/core/pull/2635
[#2641]: https://github.com/ARKEcosystem/core/pull/2641
[#2643]: https://github.com/ARKEcosystem/core/pull/2643
[#2645]: https://github.com/ARKEcosystem/core/pull/2645
[#2646]: https://github.com/ARKEcosystem/core/pull/2646
[#2651]: https://github.com/ARKEcosystem/core/pull/2651
[#2653]: https://github.com/ARKEcosystem/core/pull/2653
[#2655]: https://github.com/ARKEcosystem/core/pull/2655
[#2657]: https://github.com/ARKEcosystem/core/pull/2657
[#2659]: https://github.com/ARKEcosystem/core/pull/2659
[#2662]: https://github.com/ARKEcosystem/core/pull/2662
[#2665]: https://github.com/ARKEcosystem/core/pull/2665
[#2666]: https://github.com/ARKEcosystem/core/pull/2666
[#2669]: https://github.com/ARKEcosystem/core/pull/2669
[#2670]: https://github.com/ARKEcosystem/core/pull/2670
[#2671]: https://github.com/ARKEcosystem/core/pull/2671
[#2672]: https://github.com/ARKEcosystem/core/pull/2672
[#2673]: https://github.com/ARKEcosystem/core/pull/2673
[#2674]: https://github.com/ARKEcosystem/core/pull/2674
[#2675]: https://github.com/ARKEcosystem/core/pull/2675
[#2678]: https://github.com/ARKEcosystem/core/pull/2678
[#2685]: https://github.com/ARKEcosystem/core/pull/2685
[#2686]: https://github.com/ARKEcosystem/core/pull/2686
[#2687]: https://github.com/ARKEcosystem/core/pull/2687
[#2692]: https://github.com/ARKEcosystem/core/pull/2692
[#2699]: https://github.com/ARKEcosystem/core/pull/2699
[#2700]: https://github.com/ARKEcosystem/core/pull/2700
[#2707]: https://github.com/ARKEcosystem/core/pull/2707
[#2710]: https://github.com/ARKEcosystem/core/pull/2710
[#2711]: https://github.com/ARKEcosystem/core/pull/2711
[#2714]: https://github.com/ARKEcosystem/core/pull/2714
[#2715]: https://github.com/ARKEcosystem/core/pull/2715
[#2717]: https://github.com/ARKEcosystem/core/pull/2717
[#2718]: https://github.com/ARKEcosystem/core/pull/2718
[#2719]: https://github.com/ARKEcosystem/core/pull/2719
[#2720]: https://github.com/ARKEcosystem/core/pull/2720
[#2721]: https://github.com/ARKEcosystem/core/pull/2721
[#2723]: https://github.com/ARKEcosystem/core/pull/2723
[#2727]: https://github.com/ARKEcosystem/core/pull/2727
[#2728]: https://github.com/ARKEcosystem/core/pull/2728
[#2729]: https://github.com/ARKEcosystem/core/pull/2729
[#2733]: https://github.com/ARKEcosystem/core/pull/2733
[#2734]: https://github.com/ARKEcosystem/core/pull/2734
[#2739]: https://github.com/ARKEcosystem/core/pull/2739
[#2743]: https://github.com/ARKEcosystem/core/pull/2743
[#2744]: https://github.com/ARKEcosystem/core/pull/2744
[#2745]: https://github.com/ARKEcosystem/core/pull/2745
[#2746]: https://github.com/ARKEcosystem/core/pull/2746
[#2748]: https://github.com/ARKEcosystem/core/pull/2748
[#2751]: https://github.com/ARKEcosystem/core/pull/2751
[#2753]: https://github.com/ARKEcosystem/core/pull/2753
[#2754]: https://github.com/ARKEcosystem/core/pull/2754
[#2756]: https://github.com/ARKEcosystem/core/pull/2756
[#2757]: https://github.com/ARKEcosystem/core/pull/2757
[#2759]: https://github.com/ARKEcosystem/core/pull/2759
[#2760]: https://github.com/ARKEcosystem/core/pull/2760
[#2761]: https://github.com/ARKEcosystem/core/pull/2761
[#2763]: https://github.com/ARKEcosystem/core/pull/2763
[#2764]: https://github.com/ARKEcosystem/core/pull/2764
[#2765]: https://github.com/ARKEcosystem/core/pull/2765
[#2766]: https://github.com/ARKEcosystem/core/pull/2766
[#2770]: https://github.com/ARKEcosystem/core/pull/2770
[#2771]: https://github.com/ARKEcosystem/core/pull/2771
[#2772]: https://github.com/ARKEcosystem/core/pull/2772
[#2773]: https://github.com/ARKEcosystem/core/pull/2773
[#2777]: https://github.com/ARKEcosystem/core/pull/2777
[#2782]: https://github.com/ARKEcosystem/core/pull/2782
[#2784]: https://github.com/ARKEcosystem/core/pull/2784
[#2787]: https://github.com/ARKEcosystem/core/pull/2787
[#2788]: https://github.com/ARKEcosystem/core/pull/2788
[#2797]: https://github.com/ARKEcosystem/core/pull/2797
[#2800]: https://github.com/ARKEcosystem/core/pull/2800
[#2802]: https://github.com/ARKEcosystem/core/pull/2802
[#2807]: https://github.com/ARKEcosystem/core/pull/2807
[#2808]: https://github.com/ARKEcosystem/core/pull/2808
[#2809]: https://github.com/ARKEcosystem/core/pull/2809
[#2810]: https://github.com/ARKEcosystem/core/pull/2810
[#2814]: https://github.com/ARKEcosystem/core/pull/2814
[#2823]: https://github.com/ARKEcosystem/core/pull/2823
[#2828]: https://github.com/ARKEcosystem/core/pull/2828
[#2830]: https://github.com/ARKEcosystem/core/pull/2830
[#2831]: https://github.com/ARKEcosystem/core/pull/2831
[#2837]: https://github.com/ARKEcosystem/core/pull/2837
[#2838]: https://github.com/ARKEcosystem/core/pull/2838
[#2839]: https://github.com/ARKEcosystem/core/pull/2839
[#2840]: https://github.com/ARKEcosystem/core/pull/2840
[#2842]: https://github.com/ARKEcosystem/core/pull/2842
[#2844]: https://github.com/ARKEcosystem/core/pull/2844
[#2845]: https://github.com/ARKEcosystem/core/pull/2845
[#2847]: https://github.com/ARKEcosystem/core/pull/2847
[#2848]: https://github.com/ARKEcosystem/core/pull/2848
[#2850]: https://github.com/ARKEcosystem/core/pull/2850
[#2854]: https://github.com/ARKEcosystem/core/pull/2854
[#2855]: https://github.com/ARKEcosystem/core/pull/2855
[#2856]: https://github.com/ARKEcosystem/core/pull/2856
[#2858]: https://github.com/ARKEcosystem/core/pull/2858
[#2859]: https://github.com/ARKEcosystem/core/pull/2859
[#2861]: https://github.com/ARKEcosystem/core/pull/2861
[#2863]: https://github.com/ARKEcosystem/core/pull/2863
[#2864]: https://github.com/ARKEcosystem/core/pull/2864
[#2865]: https://github.com/ARKEcosystem/core/pull/2865
[#2867]: https://github.com/ARKEcosystem/core/pull/2867
[#2869]: https://github.com/ARKEcosystem/core/pull/2869
[#2873]: https://github.com/ARKEcosystem/core/pull/2873
[#2875]: https://github.com/ARKEcosystem/core/pull/2875
[#2877]: https://github.com/ARKEcosystem/core/pull/2877
[#2878]: https://github.com/ARKEcosystem/core/pull/2878
[#2879]: https://github.com/ARKEcosystem/core/pull/2879
[#2886]: https://github.com/ARKEcosystem/core/pull/2886
[#2887]: https://github.com/ARKEcosystem/core/pull/2887
[#2889]: https://github.com/ARKEcosystem/core/pull/2889
[#2892]: https://github.com/ARKEcosystem/core/pull/2892
[#2893]: https://github.com/ARKEcosystem/core/pull/2893
[#2894]: https://github.com/ARKEcosystem/core/pull/2894
[#2895]: https://github.com/ARKEcosystem/core/pull/2895
[#2896]: https://github.com/ARKEcosystem/core/pull/2896
[#2897]: https://github.com/ARKEcosystem/core/pull/2897
[#2898]: https://github.com/ARKEcosystem/core/pull/2898
[#2903]: https://github.com/ARKEcosystem/core/pull/2903
[#2904]: https://github.com/ARKEcosystem/core/pull/2904
[#2906]: https://github.com/ARKEcosystem/core/pull/2906
[#2907]: https://github.com/ARKEcosystem/core/pull/2907
[#2909]: https://github.com/ARKEcosystem/core/pull/2909
[#2910]: https://github.com/ARKEcosystem/core/pull/2910
[#2911]: https://github.com/ARKEcosystem/core/pull/2911
[#2912]: https://github.com/ARKEcosystem/core/pull/2912
[#2914]: https://github.com/ARKEcosystem/core/pull/2914
[#2915]: https://github.com/ARKEcosystem/core/pull/2915
[#2916]: https://github.com/ARKEcosystem/core/pull/2916
[#2918]: https://github.com/ARKEcosystem/core/pull/2918
[#2919]: https://github.com/ARKEcosystem/core/pull/2919
[#2920]: https://github.com/ARKEcosystem/core/pull/2920
[#2921]: https://github.com/ARKEcosystem/core/pull/2921
[#2923]: https://github.com/ARKEcosystem/core/pull/2923
[#2925]: https://github.com/ARKEcosystem/core/pull/2925
[#2926]: https://github.com/ARKEcosystem/core/pull/2926
[#2928]: https://github.com/ARKEcosystem/core/pull/2928
[#2929]: https://github.com/ARKEcosystem/core/pull/2929
[#2932]: https://github.com/ARKEcosystem/core/pull/2932
[#2933]: https://github.com/ARKEcosystem/core/pull/2933
[#2936]: https://github.com/ARKEcosystem/core/pull/2936
[#2937]: https://github.com/ARKEcosystem/core/pull/2937
[#2938]: https://github.com/ARKEcosystem/core/pull/2938
[#2940]: https://github.com/ARKEcosystem/core/pull/2940
[#2941]: https://github.com/ARKEcosystem/core/pull/2941
[#2942]: https://github.com/ARKEcosystem/core/pull/2942
[#2943]: https://github.com/ARKEcosystem/core/pull/2943
[#2944]: https://github.com/ARKEcosystem/core/pull/2944
[#2945]: https://github.com/ARKEcosystem/core/pull/2945
[#2947]: https://github.com/ARKEcosystem/core/pull/2947
[#2948]: https://github.com/ARKEcosystem/core/pull/2948
[#2949]: https://github.com/ARKEcosystem/core/pull/2949
[#2951]: https://github.com/ARKEcosystem/core/pull/2951
[#2952]: https://github.com/ARKEcosystem/core/pull/2952
[#2959]: https://github.com/ARKEcosystem/core/pull/2959
[#2960]: https://github.com/ARKEcosystem/core/pull/2960
[#2961]: https://github.com/ARKEcosystem/core/pull/2961
[#2962]: https://github.com/ARKEcosystem/core/pull/2962
[#2967]: https://github.com/ARKEcosystem/core/pull/2967
[#2968]: https://github.com/ARKEcosystem/core/pull/2968
[#2970]: https://github.com/ARKEcosystem/core/pull/2970
[#2972]: https://github.com/ARKEcosystem/core/pull/2972
[#2973]: https://github.com/ARKEcosystem/core/pull/2973
[#2974]: https://github.com/ARKEcosystem/core/pull/2974
[#2976]: https://github.com/ARKEcosystem/core/pull/2976
[#2979]: https://github.com/ARKEcosystem/core/pull/2979
[#2980]: https://github.com/ARKEcosystem/core/pull/2980
[#2994]: https://github.com/ARKEcosystem/core/pull/2994
[#2996]: https://github.com/ARKEcosystem/core/pull/2996
[#2997]: https://github.com/ARKEcosystem/core/pull/2997
[#2998]: https://github.com/ARKEcosystem/core/pull/2998
[#2999]: https://github.com/ARKEcosystem/core/pull/2999
[#3000]: https://github.com/ARKEcosystem/core/pull/3000
[#3001]: https://github.com/ARKEcosystem/core/pull/3001
[#3005]: https://github.com/ARKEcosystem/core/pull/3005
[#3008]: https://github.com/ARKEcosystem/core/pull/3008
[#3010]: https://github.com/ARKEcosystem/core/pull/3010
[#3011]: https://github.com/ARKEcosystem/core/pull/3011
[#3014]: https://github.com/ARKEcosystem/core/pull/3014
[#3015]: https://github.com/ARKEcosystem/core/pull/3015
[#3022]: https://github.com/ARKEcosystem/core/pull/3022
[#3023]: https://github.com/ARKEcosystem/core/pull/3023
[#3025]: https://github.com/ARKEcosystem/core/pull/3025
[#3027]: https://github.com/ARKEcosystem/core/pull/3027
[#3030]: https://github.com/ARKEcosystem/core/pull/3030
[#3034]: https://github.com/ARKEcosystem/core/pull/3034
[#3036]: https://github.com/ARKEcosystem/core/pull/3036
[#3037]: https://github.com/ARKEcosystem/core/pull/3037
[#3040]: https://github.com/ARKEcosystem/core/pull/3040
[#3041]: https://github.com/ARKEcosystem/core/pull/3041
[#3043]: https://github.com/ARKEcosystem/core/pull/3043
[#3045]: https://github.com/ARKEcosystem/core/pull/3045
[#3046]: https://github.com/ARKEcosystem/core/pull/3046
[#3048]: https://github.com/ARKEcosystem/core/pull/3048
[#3049]: https://github.com/ARKEcosystem/core/pull/3049
[#3050]: https://github.com/ARKEcosystem/core/pull/3050
[#3055]: https://github.com/ARKEcosystem/core/pull/3055
[#3056]: https://github.com/ARKEcosystem/core/pull/3056
[#3062]: https://github.com/ARKEcosystem/core/pull/3062
[#3069]: https://github.com/ARKEcosystem/core/pull/3069
[#3071]: https://github.com/ARKEcosystem/core/pull/3071
[#3075]: https://github.com/ARKEcosystem/core/pull/3075
[#3078]: https://github.com/ARKEcosystem/core/pull/3078
[#3081]: https://github.com/ARKEcosystem/core/pull/3081
[#3083]: https://github.com/ARKEcosystem/core/pull/3083
[#3084]: https://github.com/ARKEcosystem/core/pull/3084
[#3086]: https://github.com/ARKEcosystem/core/pull/3086
[#3087]: https://github.com/ARKEcosystem/core/pull/3087
[#3095]: https://github.com/ARKEcosystem/core/pull/3095
[#3096]: https://github.com/ARKEcosystem/core/pull/3096
[#3108]: https://github.com/ARKEcosystem/core/pull/3108
[#3109]: https://github.com/ARKEcosystem/core/pull/3109
[#3112]: https://github.com/ARKEcosystem/core/pull/3112
[#3119]: https://github.com/ARKEcosystem/core/pull/3119
[#3138]: https://github.com/ARKEcosystem/core/pull/3138
[#3140]: https://github.com/ARKEcosystem/core/pull/3140
[#3147]: https://github.com/ARKEcosystem/core/pull/3147
[#3154]: https://github.com/ARKEcosystem/core/pull/3154
[#3170]: https://github.com/ARKEcosystem/core/pull/3170
[#3171]: https://github.com/ARKEcosystem/core/pull/3171
[#3193]: https://github.com/ARKEcosystem/core/pull/3193
[#3196]: https://github.com/ARKEcosystem/core/pull/3196
[#3208]: https://github.com/ARKEcosystem/core/pull/3208
[#3208]: https://github.com/ARKEcosystem/core/pull/3208
[#3228]: https://github.com/ARKEcosystem/core/pull/3228
[#3234]: https://github.com/ARKEcosystem/core/pull/3234
[#3256]: https://github.com/ARKEcosystem/core/pull/3256
[#3270]: https://github.com/ARKEcosystem/core/pull/3270
[#3271]: https://github.com/ARKEcosystem/core/pull/3271
[#3291]: https://github.com/ARKEcosystem/core/pull/3291
[#3296]: https://github.com/ARKEcosystem/core/pull/3296
[#3331]: https://github.com/ARKEcosystem/core/pull/3331
[#3341]: https://github.com/ARKEcosystem/core/pull/3341
[#3354]: https://github.com/ARKEcosystem/core/pull/3354
[#3404]: https://github.com/ARKEcosystem/core/pull/3404
[#3409]: https://github.com/ARKEcosystem/core/pull/3409
[#3426]: https://github.com/ARKEcosystem/core/pull/3426
[#3459]: https://github.com/ARKEcosystem/core/pull/3459
[#3465]: https://github.com/ARKEcosystem/core/pull/3465
[#3489]: https://github.com/ARKEcosystem/core/pull/3489
[#3498]: https://github.com/ARKEcosystem/core/pull/3498
[#3502]: https://github.com/ARKEcosystem/core/pull/3502
[#3504]: https://github.com/ARKEcosystem/core/pull/3504
[#3505]: https://github.com/ARKEcosystem/core/pull/3505
[#3507]: https://github.com/ARKEcosystem/core/pull/3507
[#3510]: https://github.com/ARKEcosystem/core/pull/3510
[#3518]: https://github.com/ARKEcosystem/core/pull/3518
[#3523]: https://github.com/ARKEcosystem/core/pull/3523
[#3524]: https://github.com/ARKEcosystem/core/pull/3524
[#3537]: https://github.com/ARKEcosystem/core/pull/3537
[#3541]: https://github.com/ARKEcosystem/core/pull/3541
[#3551]: https://github.com/ARKEcosystem/core/pull/3551
[#3560]: https://github.com/ARKEcosystem/core/pull/3560
[#3561]: https://github.com/ARKEcosystem/core/pull/3561
[#3562]: https://github.com/ARKEcosystem/core/pull/3562
[#3567]: https://github.com/ARKEcosystem/core/pull/3567
[#3570]: https://github.com/ARKEcosystem/core/pull/3570
[#3573]: https://github.com/ARKEcosystem/core/pull/3573
[#3574]: https://github.com/ARKEcosystem/core/pull/3574
[#3575]: https://github.com/ARKEcosystem/core/pull/3575
[#3590]: https://github.com/ARKEcosystem/core/pull/3590
[#3594]: https://github.com/ARKEcosystem/core/pull/3594
[#3596]: https://github.com/ARKEcosystem/core/pull/3596
[#3598]: https://github.com/ARKEcosystem/core/pull/3598
[#3605]: https://github.com/ARKEcosystem/core/pull/3605
[#3614]: https://github.com/ARKEcosystem/core/pull/3614
[#3659]: https://github.com/ARKEcosystem/core/pull/3659
[#3665]: https://github.com/ARKEcosystem/core/pull/3665
[#3667]: https://github.com/ARKEcosystem/core/pull/3667
[#3669]: https://github.com/ARKEcosystem/core/pull/3669
[#3678]: https://github.com/ARKEcosystem/core/pull/3678
[#3695]: https://github.com/ARKEcosystem/core/pull/3695
[#3746]: https://github.com/ARKEcosystem/core/pull/3746
[032caa1b990e91937e4bc1561bc1aeaeca9e37d]: https://github.com/ARKEcosystem/core/commit/032caa1b990e91937e4bc1561bc1aeaeca9e37d9
[1209a36366c8fd3ba31fab2463011b7ce1a7d84]: https://github.com/ARKEcosystem/core/commit/1209a36366c8fd3ba31fab2463011b7ce1a7d844
[34749bf84bcec3fecd0098c0d42f52deb1f6ba4]: https://github.com/ARKEcosystem/core/commit/34749bf84bcec3fecd0098c0d42f52deb1f6ba4a
[7a73aef8b29d40572d1524cf8b1bafbffa3b096]: https://github.com/ARKEcosystem/core/commit/7a73aef8b29d40572d1524cf8b1bafbffa3b0964
[b537d6f327e939ff40b680ea7d558e8fdb3ac92]: https://github.com/ARKEcosystem/core/commit/b537d6f327e939ff40b680ea7d558e8fdb3ac921
