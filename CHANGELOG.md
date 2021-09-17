# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2021-09-17
### Added

-   Check aip37 when transaction is switch-vote ([c017e1a83], [@rainydio])
-   Added vendor field support to transaction factory ([8074203b7], [@kovaczan])
-   Fee stats from last 20 tx when no days param is provided ([2c18ee218], [@air1one])
-   Implement `manager:status`, `manager:log` & `manager:restart` cli commands ([89213147c], [@sebastijankuzner])
-   Support custom crypto packages ([aaf99b46f], [@sebastijankuzner])
-   Support custom network configurations ([4570d9fce], [@sebastijankuzner])
-   Implements `config:manager` cli command ([e36a18a9d], [@sebastijankuzner])
-   Support ZIP archive on `log.download` ([d3d77e852], [@sebastijankuzner])
-   Allow bearer token in URL ([a2bcbace7], [@sebastijankuzner])
-   Sort logs descending by defaut on `log.search` ([bb951a66b], [@sebastijankuzner])
-   Include transaction-pool options in node/configuration ([0909adc19], [@sebastijankuzner])
-   Implements `log.download` action ([94531d0a1], [@sebastijankuzner])
-   Return block height in API response headers ([79c2b1bf5], [@air1one])
-   Support custom tokens ([bf75b5b29], [@sebastijankuzner])
-   Set database default and max response limit ([82edd4633], [@sebastijankuzner])
-   Read token and network from config.json ([49e89a8f8], [@sebastijankuzner])
-   Store logs in sqlite database ([0d97a5125], [@sebastijankuzner])
-   Implement database delete support ([3ff160f5a], [@sebastijankuzner])
-   Implement database indexing support ([2b4659d0a], [@sebastijankuzner])
-   Implements info.resources action ([c480df8c6], [@sebastijankuzner])
-   P2P IPv6 support ([29c7ebb75], [@sebastijankuzner])
-   Ip address utils ([a776999aa], [@sebastijankuzner])
-   Rate limit plugin ([21eb71a8f], [@air1one])
-   Implement info.coreUpdate action ([1f28875f4], [@sebastijankuzner])
-   Add vendor field length cli flag ([e12f73f2c], [@rainydio])
-   Ser/deser on p2p and use binary over ws ([0526ad03a], [@air1one])
-   Set dynamic fees in network:generate ([feb1d6bc8], [@sebastijankuzner])
-   Add additional flags into network:generate command ([1f7468135], [@sebastijankuzner])
-   Enable wallet sync though environment variable ([b54816005], [@rainydio])
-   Sync wallet to database ([f320c0acd], [@rainydio])
-   Implement `Queue#isRunning/isStarted/onDrain/onError/onData` methods ([d80768479], [@sebastijankuzner])
-   Transform comma query into array to allow OR ([0a69f6597], [@air1one])
-   Unvote+vote transaction ([700b9cd6f], [@rainydio])
-   Wallet autoIndex option ([51d01a2db], [@sebastijankuzner])
-   Implement peer blacklisting ([f18928dd5], [@sebastijankuzner])
-   Split into 3 ports for blocks / transactions / others ([9796d138a], [@air1one])
-   Enable registering routes with pagination ([47d3cf20d], [@sebastijankuzner])
-   Add block and transactions indexes migration ([b42bfb6f7], [@sebastijankuzner])
-   Forget unresponsive peer ([5222b5cfb], [@sebastijankuzner])
-   Aip36 delegate entity ([9f2eb6296], [@air1one])
-   Include estimateTotalCount into peers response ([ed8a0e803], [@sebastijankuzner])
-   AIP36 ([36c1ca768], [@air1one])
-   Disable individual watchers ([e943e5635], [@sebastijankuzner])
-   Set up aip36 milestone to enable entity transactions ([d9fc0c094], [@air1one])
-   Implement database query support ([8a2033ac9], [@sebastijankuzner])
-   Dispatch wallet events ([7cb916abc], [@sebastijankuzner])
-   Implement AIP36 ([ce618cc3c], [@air1one])
-   Dispatch schedule events ([cc7073833], [@sebastijankuzner])
-   Dispatch queue events ([9ac9b453a], [@sebastijankuzner])
-   Implement `info.lastForgedBlock` action ([6f9887f92], [@sebastijankuzner])
-   Dispatch webhook events ([7ca7d9682], [@sebastijankuzner])
-   Implement `watcher.getEvents` action ([4757531e0], [@sebastijankuzner])
-   Implement log watcher ([1bfc528ab], [@sebastijankuzner])
-   Disaptch additional transaction-pool events ([4190ed639], [@sebastijankuzner])
-   Implements DatabaseLogger ([1c968188e], [@sebastijankuzner])
-   Implement events listener and events database ([29672aa9e], [@sebastijankuzner])
-   Implement `info.nextForgingSlot` action ([d204f752f], [@sebastijankuzner])
-   Implement workers ([d70c42275], [@rainydio])
-   Implements `forger.nextSlot` process actions ([6dacdfbb8], [@sebastijankuzner])
-   Implement `info.currentDelegate` action ([85287670b], [@sebastijankuzner])
-   Implement `snapshots.restore` action ([bd0370e3c], [@sebastijankuzner])
-   Implements `forger.lastForgedBlock` process actions ([97746d0cf], [@sebastijankuzner])
-   Implement trigger method in ProcessManager ([cf8a401bc], [@sebastijankuzner])
-   EstimateTotalCount API parameter ([c52b6ab74], [@rainydio])
-   Implement `snapshots.list` action ([7a8bb932d], [@sebastijankuzner])
-   Implements `forger.currentDelegate` process action ([052aae85f], [@sebastijankuzner])
-   Implement `snapshots.delete` action ([f87e146fb], [@sebastijankuzner])
-   Implement `snapshots.create` action ([82382fc9c], [@sebastijankuzner])
-   Implement process actions ([1cb7e23ed], [@sebastijankuzner])
-   Implement `log.log` action ([fa49ca804], [@sebastijankuzner])
-   Implement `log.archived` action ([10e821751], [@sebastijankuzner])
-   Implement `configuration.updatePlugins` action ([36a607abc], [@sebastijankuzner])
-   Implement `configuration.updateEnv` action ([ca28f66f2], [@sebastijankuzner])
-   Implement `configuration.getPlugins` action ([dcfff76d1], [@sebastijankuzner])
-   Implement `configuration.getEnv` action ([ef450f9d3], [@sebastijankuzner])
-   Count estimation ([118be7ba3], [@rainydio])
-   Implement `process.list` action ([f31109fc6], [@sebastijankuzner])
-   Implement `process.stop` action ([7db012655], [@sebastijankuzner])
-   Implement `process.start` action  ([c8fdde97c], [@sebastijankuzner])
-   Implement `process.restart` action ([3559f71ed], [@sebastijankuzner])
-   Implement `info.databaseSize` action ([f28ba8db8], [@sebastijankuzner])
-   Implement `info.diskSpace` action ([67cd2c67f], [@sebastijankuzner])
-   Implement `info.blockchainHeight` action ([9c20c02e0], [@sebastijankuzner])
-   Implement `info.coreStatus` action ([40ddab0d2], [@sebastijankuzner])
-   Implement `info.coreVersion` action ([4ef29686b], [@sebastijankuzner])
-   Feat(core-manager) implement token authentication ([81ebb9496], [@sebastijankuzner])
-   Implement basic authentication ([c30425775], [@sebastijankuzner])
-   Implement IP whitelisting ([9894e9aba], [@sebastijankuzner])
-   Implement core-manager skeleton ([fed54c9df], [@sebastijankuzner])
-   Implement core-snapshots package ([8df596ab2], [@sebastijankuzner])
-   Dynamic block times ([084b39624], [@bertiespell])
-   Hapi/nes implementation ([4ff97a26f], [@air1one])
-   Integrate triggers and actions ([0d5390fd4], [@sebastijankuzner])
-   Add reusable mocks from tests ([a82a09437], [@sebastijankuzner])
-   Transaction to string method ([4999fec69], [@rainydio])
-   Add flag to skip export of rolled back transactions ([b88806f5e], [@dated])
-   Filter peers by version range ([1359ba207], [@dated])
-   Implement dynamic fees ([af4b1b3b0], [@air1one])
-   Retrieve business by username, address or public key ([cf831409f], [@dated])
-   Add bridgechain asset repository (bridgechain registration and update) ([0805613cd], [@air1one])
-   Initial draft implementation of pluggable CLI ([8465625eb], [@faustbrian])
-   Stricter resource-based orderBy schema ([e9e518ec9], [@dated])
-   Ioc tags ([ff8975a04], [@rainydio])
-   Improve incoming WS message check + IP banning on worker ([94766eaeb], [@faustbrian])
-   Stricter p2p msg check + ip blocking ([5d21a3447], [@air1one])
-   Allow use of custom crypto configuration ([84aee929d], [@faustbrian])
-   Allow extension of cache and queue service ([daadf358a], [@faustbrian])
-   Manual registration of service providers and configuration options ([460c6faac], [@faustbrian])
-   Support modifiers in transaction factories ([5191f6996], [@faustbrian])
-   Implement peer factory ([cded589bd], [@faustbrian])
-   Implement transaction factories ([c76062089], [@faustbrian])
-   Implement null drivers ([dd83c08b2], [@faustbrian])
-   Initial draft implementation ([a636dfd38], [@faustbrian])
-   Dispatch cache events ([c4a8b70d2], [@faustbrian])
-   Implement in-memory logger as default ([a116e3f06], [@faustbrian])
-   Allow searching businesses and bridgechains by isResigned ([ab78411e9], [@dated])
-   Implement block factory ([5a5b3d7fa], [@faustbrian])
-   Implement transfer factory ([de75e6ea9], [@faustbrian])
-   Implement peer factory ([e323bb500], [@faustbrian])
-   Add round and forger tracker ([044ca8303], [@faustbrian])
-   Add ports to bridgechain registration/update ([c520d8195], [@dated])
-   Implement rate-limiter-flexible plugin ([cb50a6221], [@faustbrian])
-   Validate the application configuration ([3f62bb54c], [@faustbrian])
-   Implement pipeline service ([be2522600], [@faustbrian])
-   Allow enabling/disabling log methods ([292d9e84d], [@faustbrian])
-   Introduce process specific application configurations ([1a4e13201], [@faustbrian])
-   Add command to clear transaction pool ([56f482d5b], [@dated])
-   Add service provider events ([00f4964be], [@faustbrian])
-   Implement Address.fromWIF method ([c1eafab5b], [@faustbrian])
-   Filter locks by expiration status ([91e815eb0], [@dated])
-   Ensure unique genesisHash per bridgechain  ([5dbc8a8fc], [@lemii])
-   Add `isExpired` property to locks response ([ad8595112], [@dated])
-   Implement factories and generators ([bb91fab5f], [@faustbrian])
-   Add additional fields to bridgechains search sc… ([dee3a5c17], [@dated])
-   Implement throttling on outgoing p2p communication ([4574e6e68], [@vasild])
-   Add additional fields to businesses search sche… ([05dd51fdf], [@dated])
-   Ensure unique bridgechain name per business ([f2ced87fc], [@dated])
-   Implement businesses/bridgechains endpoint ([697d34779], [@dated])
-   Implement assertion utilities ([47275d674], [@faustbrian])
-   Add flush methods for attributes ([5c404b69b], [@faustbrian])
-   Get dependencies and required state from manifest ([95a787c20], [@faustbrian])
-   Implement plugin aliases ([213b71a12], [@faustbrian])
-   Support numerical and reference keys for attributes ([c53f6f52e], [@faustbrian])
-   Scoped attribute indexes ([c78e56116], [@faustbrian])
-   Install plugins from local tarballs ([8f7d0d319], [@faustbrian])
-   Initial draft implementation (non-fun ([2d5ea1aa8], [@faustbrian])
-   Install, update and remove plugins ([3753b290c], [@faustbrian])
-   Add support for transaction nonces ([daa830f82], [@vasild])
-   Load crypto configuration from directory ([b37233e30], [@faustbrian])
-   Allow CLI command configurations ([ad5e82306], [@faustbrian])
-   Initial draft of attributes service ([08ca0fac5], [@faustbrian])
-   Implement app config to configure log service ([dd4c9aba0], [@faustbrian])
-   Use compression on the p2p level ([f5c185fe2], [@vasild])
-   Initial draft of mixin service ([0367e8e14], [@faustbrian])
-   Initial draft of queues ([5e5eb2a46], [@faustbrian])
-   Schedule tasks by cron or block intervals ([cfd39d085], [@faustbrian])
-   Watch configuration and restart core on change ([344de61ac], [@faustbrian])
-   Initial draft of new container ([583f5a928], [@faustbrian])
-   Initial draft of actions ([1a823ee70], [@faustbrian])
-   Implement reusable exceptions ([75c117741], [@faustbrian])
-   Auto-discovery for package manifest and config ([d449340c7], [@faustbrian])
-   Use compression on the p2p level ([a201d64ff], [@vasild])
-   Ability to listen to bootstrapping events ([bf4222444], [@faustbrian])
-   Support creation of scoped child containers ([9d12bb1fc], [@faustbrian])
-   Validate and cast package configuration on register ([ade3a5d49], [@faustbrian])
-   Required plugins to terminate on registration failure ([d44e29ccc], [@faustbrian])
-   Validation service ([1de4f3fce], [@faustbrian])
-   Add relay:share command to share relay instances via ngrok ([42b0805c0], [@faustbrian])
-   Handle inclusion and exclusion of service providers ([fc157999e], [@faustbrian])
-   Conditional enabling and disabling of services ([77893fda5], [@faustbrian])
-   Implement builder pattern to support driver-based plugins ([9b368c957], [@faustbrian])
-   Filesystem abstraction ([0f7e589b4], [@faustbrian])
-   Application and service provider bootstrappers ([85b6b605e], [@faustbrian])
-   Initial draft of cache ([3c413d434], [@faustbrian])
-   Initial draft of event dispatcher ([5d96cbfc4], [@faustbrian])
-   Initial draft of scheduler ([a399f1948], [@faustbrian])
-   Initial draft of core-kernel ([f47b55c84], [@faustbrian])

### Changed

-   Install specific version of plugin ([013b6b015], [@sebastijankuzner])
-   Refactor codecs so buffer isn't re-allocated 400 times. ([b7f62ef34], [@rainydio])
-   Remove core-manager related commands and setting ([51539e1b1], [@sebastijankuzner])
-   Remove package ([e7953c241], [@sebastijankuzner])
-   Skip prompts when using `--force` flag on `update` command ([50f25c74d], [@sebastijankuzner])
-   Optional parameters & type check ([d41d65c93], [@sebastijankuzner])
-   Use `levels` and `processes` params on `log.search` ([4ca684c97], [@sebastijankuzner])
-   Use `--force` flag on install ([865f2d066], [@sebastijankuzner])
-   Use EntityNamesTypes index ([600ca0456], [@sebastijankuzner])
-   Implements `process.delete` action ([063e92923], [@sebastijankuzner])
-   Add updateProcessManager flag in `update` command ([1f259ae31], [@sebastijankuzner])
-   Exit cli gracefully ([92f22448b], [@sebastijankuzner])
-   Load ServiceProviders from plugins folder ([9b59a20ee], [@sebastijankuzner])
-   Load CLI plugins ([464fc9aad], [@sebastijankuzner])
-   GetPeersConfig from loaded config ([0bf55c252], [@sebastijankuzner])
-   Implements await block processing plugin ([3c757e9c1], [@sebastijankuzner])
-   Queue extends EventEmitter ([5051dcea9], [@sebastijankuzner])
-   Remove updateNetworkStatus on Blockchain ([c1af74dca], [@sebastijankuzner])
-   Remove excess flags ([13d070919], [@sebastijankuzner])
-   Allow invalid bip39 passphrases ([7a6a4e9a4], [@sebastijankuzner])
-   Update node version to 14.x in install.sh scripts ([689d62941], [@sebastijankuzner])
-   Add @rainydio and @sebastijankuzner to codeowners ([aef8a3848], [@sebastijankuzner])
-   Check forged transactions in StateStore ([b158513cc], [@sebastijankuzner])
-   Keep record of last stored block height ([ba386e3a1], [@sebastijankuzner])
-   Implements getBlock on DatabaseInterceptor ([89975ab67], [@sebastijankuzner])
-   Paralel broadcast ([56111ed1d], [@sebastijankuzner])
-   Use Core transaction group as default ([83bb890d9], [@sebastijankuzner])
-   Remove valuesByIndex ([4f6cc0bed], [@sebastijankuzner])
-   Broadcast block delay ([eb1bb6be9], [@sebastijankuzner])
-   Resolve plugin enabled value ([838d897ff], [@sebastijankuzner])
-   Downloaded chunks cache ([986d86a0c], [@sebastijankuzner])
-   Use getters and setter on wallet ([9724ff42c], [@sebastijankuzner])
-   RoundState in singleton scope ([0b9b54915], [@sebastijankuzner])
-   Improve wallet repository clone performance ([a304173a9], [@sebastijankuzner])
-   Implement throwIfCannotEnterPool on IPFS ([3e79f9cd5], [@sebastijankuzner])
-   Implement throwIfCannotEnterPool on MultiSignatureRegistration ([bebe9522a], [@sebastijankuzner])
-   Implement throwIfCannotEnterPool on Entity ([1d5a5c524], [@sebastijankuzner])
-   Cleanup htlcRefund ([04a1bbae7], [@sebastijankuzner])
-   Remove double multiSignature set in MultiSignatureRegistration ([4596c85ea], [@sebastijankuzner])
-   Join duplicated logs ([9a3d9ee7e], [@sebastijankuzner])
-   Split DatabaseInteractions ([bed6bef47], [@sebastijankuzner])
-   Schedule network status updates when networkStart flag is set ([c08ebd4f2], [@sebastijankuzner])
-   Implement get and set for restoredDatabaseIntegrity ([a030900fe], [@sebastijankuzner])
-   Set default file log level to `debug` ([e911c9b65], [@sebastijankuzner])
-   Remove unused request schemas ([9e079053b], [@sebastijankuzner])
-   PushPingBlock after slot check ([9cc883b6d], [@sebastijankuzner])
-   Expose NetworkState getters ([2b9a4125b], [@sebastijankuzner])
-   Inject objects with Inversify ([3b2f5eb0f], [@sebastijankuzner])
-   Register ForgerService on boot ([b6a2d854f], [@sebastijankuzner])
-   Remove unnecessary block check ([43b9c86c7], [@sebastijankuzner])
-   Build server on boot ([ff1fcdba6], [@sebastijankuzner])
-   Remove unused clear method on stateStore ([c20652ef4], [@sebastijankuzner])
-   Expose get & set methods on StateStore ([aa671a1ae], [@sebastijankuzner])
-   Add missing interfaces ([fa98820fe], [@sebastijankuzner])
-   Use Queue worker jobs ([dd0500bd4], [@sebastijankuzner])
-   Use correct pluralization form in logs  ([8b38064b7], [@sebastijankuzner])
-   Add required fields ([3fdb47329], [@sebastijankuzner])
-   Verify codec on snapshot:dump command ([1670b2342], [@sebastijankuzner])
-   Allow only QueueJob in Queue ([dabea9561], [@sebastijankuzner])
-   Lint and include types ([9361d5cb2], [@sebastijankuzner])
-   Move snapshot progress renderer to core-snapshots package ([cb7548180], [@sebastijankuzner])
-   Improve database query performance ([919e9205d], [@sebastijankuzner])
-   Set default max payload on ws client ([ab7d013b2], [@air1one])
-   Use core-database connection in core-snapshots ([8a658f4aa], [@sebastijankuzner])
-   Add integer checks to service provider schemas ([3cf365397], [@sebastijankuzner])
-   Rename env variables CORE_MONITOR_* to CORE_MANAGER_* ([c5808c1f8], [@sebastijankuzner])
-   Replace repeated fields in getBlocks with custom ser/deser ([d85d60bc6], [@air1one])
-   Queue postTransactions requests ([409149c65], [@air1one])
-   Set up a rate limit on `postTransactions` ([66e1b571c], [@air1one])
-   Allow unknow fields in package configuration ([9e2434a82], [@sebastijankuzner])
-   Add CORE_P2P_MIN_NETWORK_REACH env variable ([21b12d476], [@sebastijankuzner])
-   Rename peer storage into repository ([bdb6ce765], [@rainydio])
-   Improve service provider schema ([af4a58f83], [@sebastijankuzner])
-   Test every wallet vote balance ([348f63df3], [@rainydio])
-   Implements service provider schema ([39caa0b07], [@sebastijankuzner])
-   Implements service provider schema ([6d86afc96], [@sebastijankuzner])
-   Implements service provider schema ([df2c5ad4b], [@sebastijankuzner])
-   Implements service provider schema ([1faef3725], [@sebastijankuzner])
-   Implements service provider schema ([16e638335], [@sebastijankuzner])
-   Implements service provider schema ([802b248d7], [@sebastijankuzner])
-   Re-enable timeout on p2p emit ([7bba591e4], [@air1one])
-   Pool processor to be injected directly ([147c4de4f], [@air1one])
-   Separate HTTP and JSON-RPC server ([da715649f], [@sebastijankuzner])
-   Implements service provider schema ([59b94008c], [@sebastijankuzner])
-   Implements service provider schema ([64659881d], [@sebastijankuzner])
-   Implements service provider schema ([f1eb6077f], [@sebastijankuzner])
-   Mirror revert block from forger ([f0eebd877], [@rainydio])
-   Implements service provider schema ([5c95ce66f], [@sebastijankuzner])
-   Add delay on multiple reconnections (client socket) ([fe8fd07ac], [@air1one])
-   Full download link on `log.archived` ([e16b841be], [@sebastijankuzner])
-   Await log generation on `log.download` ([ea3d71551], [@sebastijankuzner])
-   Enable rate limit ([015dde805], [@sebastijankuzner])
-   Custom ser/deser of transactions in `postTransactions` codec ([9c1ad8048], [@air1one])
-   Don't throw when receiving unchained block ([374c038af], [@sebastijankuzner])
-   Improve block download when above maxPayload ([8d2aef9a6], [@air1one])
-   Remove :chains: from logs ([daab2cc08], [@sebastijankuzner])
-   Set maxBytes on all routes and update postTransactions validation schema ([dd887ec70], [@air1one])
-   Remove unused entity subhandlers ([a49fb040e], [@rainydio])
-   Show and download logs from archive ([30d0788ac], [@sebastijankuzner])
-   Remove core-manager plugin from app.json ([e68ed0efc], [@sebastijankuzner])
-   Remove `@arkecosystem/core-manager` from default app.json files ([2392b4f62], [@faustbrian])
-   Use dependencies only for manager process type ([2a811608d], [@sebastijankuzner])
-   Validate version on all p2p endpoints ([633d0a0b2], [@air1one])
-   Include missing dependencies ([ca2dcdc8a], [@sebastijankuzner])
-   Match entity schema name with delegate username (2.7) ([4e85a7442], [@air1one])
-   Match entity schema name with delegate username ([7b19c8de7], [@air1one])
-   Support async PM2 triggers ([30ea0c372], [@sebastijankuzner])
-   Enable core-manager on all processes ([9eb1ce976], [@sebastijankuzner])
-   Single database path setting ([57eaabf07], [@sebastijankuzner])
-   Limit hapi ping messages ([9f0349ba2], [@air1one])
-   Extract common database logic ([4c8d44e8e], [@sebastijankuzner])
-   Remove database dependency from forger ([86cb3cc75], [@rainydio])
-   Remove `info.diskSpace` action ([96c672d08], [@sebastijankuzner])
-   Terminate on ws.ping() ws.pong() ([9f9178d88], [@air1one])
-   Use a convention for how HTTP/HTTPS ports are exposed and discovered ([566d5a25c], [@faustbrian])
-   Get version channel from core-cli config ([7aba83f31], [@sebastijankuzner])
-   Re-organize plugins in hapi lifecycle ([aebf70e87], [@air1one])
-   Rename log.log to log.search ([ab5b2ad49], [@sebastijankuzner])
-   Extract cli-manager logic ([40ec05da6], [@sebastijankuzner])
-   Remove deprecated versioning channels ([26da8d8f6], [@sebastijankuzner])
-   More granular filters for log:log action ([118c4d48b], [@sebastijankuzner])
-   Prettier network-generate formatting ([04b47c10c], [@rainydio])
-   Update @arkecosystem/utils version to 1.2.1 ([307ba66de], [@air1one])
-   `network:generate` to generate genesis block with v2 txs ([f12173c83], [@air1one])
-   Use consistent number formatting ([7b35d02a5], [@sebastijankuzner])
-   Add listeners on 'connecting' event ([b56259267], [@alessiodf])
-   Custom validation for getCommonBlocks ([2b3936357], [@alessiodf])
-   BIP38 repeat password for confirmation ([3f5d49432], [@sebastijankuzner])
-   Plugins and env endpoints adjustements ([46d80da5a], [@sebastijankuzner])
-   Use single port for p2p ([66c19e3f7], [@air1one])
-   Add `install-next.sh` script for devnet installations ([0b172029d], [@faustbrian])
-   Remove fork 6 mention ([109e26554], [@faustbrian])
-   Use `@arkecosystem/crypto-identities` to handle identity interactions ([2059dba26], [@faustbrian])
-   Block processing ([9e3704077], [@sebastijankuzner])
-   Use `@arkecosystem/crypto-networks` to handle network configurations ([02c272e6f], [@faustbrian])
-   Create index if not exists ([5c309ea40], [@sebastijankuzner])
-   Migration: add asset.payments index to transactions ([84595c67f], [@sebastijankuzner])
-   Deserialize block from Buffer ([5666c122e], [@air1one])
-   Remove deprecated env variables ([aa0643ac7], [@sebastijankuzner])
-   Implement trigger unbind and rebind methods ([24a488cda], [@sebastijankuzner])
-   Return [] if asked higher blocks than current ([312899c90], [@air1one])
-   Enable trustProxy option ([850ade02a], [@air1one])
-   Update install script for setting env ([3b7a1fe3e], [@air1one])
-   Update banner ([617fd7694], [@faustbrian])
-   Define default p2p timeouts ([ce3d9302f], [@air1one])
-   Remove `@arkecosystem/core-manager` from default configs ([3e76be0c7], [@faustbrian])
-   Fire wallet events ([2c43f6c60], [@rainydio])
-   Allow array query parameter in all schemas ([a13bf618a], [@air1one])
-   Force typeorm version 0.2.25 ([e8000a637], [@air1one])
-   Remove import from dist or src ([6e969dd1f], [@air1one])
-   Remove search endpoints ([deb2cd78b], [@air1one])
-   3.0 docker updates ([6ff407206], [@adrian69])
-   Aip36 milestone for mainnet ([ec8cbb94f], [@air1one])
-   Extend /node/fees and /transactions/fees with entities static fees ([773eb8ce7], [@air1one])
-   Do not bind directly handler to class method to allow extending response ([bab1d914a], [@air1one])
-   CloneWallet method in wallet-repository ([d0775fdc4], [@sebastijankuzner])
-   Ts-ignore ([feb1970e6], [@air1one])
-   Lint ([24b164b19], [@air1one])
-   Add devnet exception ([5da4f4dfa], [@air1one])
-   Custom entity fees for register/update/resign ([ed835c291], [@air1one])
-   Use deepmerge for plugin configuration ([777199760], [@sebastijankuzner])
-   Activate all entity types + re-allocate entity type enum ([649aeaceb], [@air1one])
-   Add indexers export ([437f8cfd5], [@air1one])
-   Wallet repository search methods ([17fcaf375], [@rainydio])
-   Verify peer claimed state ([24a8b044e], [@air1one])
-   Add exports for bridgechains ([a27b6c3fa], [@air1one])
-   Set maxPayload on ws server ([bf892b530], [@sebastijankuzner])
-   Include missing dependencies in package.json ([6bb4feddd], [@sebastijankuzner])
-   Export state-builder ([ae160d6e7], [@air1one])
-   More flexible entity types / sub-types + fees update ([06261f99c], [@air1one])
-   Add publickey verification ([440889927], [@sleepdefic1t])
-   Throw more specific multi-signature exceptions ([48e67e518], [@faustbrian])
-   Initialize blockchain when resolved first time ([3f8727b2d], [@rainydio])
-   Add devnet exception ([78c49b4ac], [@air1one])
-   Remove forget methods and use index instead ([9a6358a5f], [@sebastijankuzner])
-   Dot-separated-query hapi plugin ([d6803913c], [@rainydio])
-   Pagination configuration through joi context ([8ebf8218b], [@rainydio])
-   Put configuration into Joi context ([0ff67a96b], [@rainydio])
-   Remove bridgechain from aip36 entities ([085ab675c], [@air1one])
-   Keep process var over .env var ([640b9a1a0], [@sebastijankuzner])
-   Get registered server route ([08d8c9365], [@sebastijankuzner])
-   Use HEAD HTTP request for ping ([fcbe909bb], [@sebastijankuzner])
-   Add 3.0.0 alpha channel to valid peer versions ([f2da0bd85], [@air1one])
-   Trigger processes from ark-core or ark-forger ([f00e075da], [@sebastijankuzner])
-   BlocksInCurrentRound and forgingDelegates are arrays ([50ce984e1], [@sebastijankuzner])
-   Remove excess code from hapi-nes ([f0fe8b939], [@sebastijankuzner])
-   Remove obsolete matchers package from merge ([76e9317a3], [@air1one])
-   Bump xstate ([0601aea47], [@air1one])
-   Ts ignore ([c03c2dcfe], [@air1one])
-   Upload codecov reports all at once ([60624a3fd], [@rainydio])
-   Union query typeGroup with number ([1a81aee41], [@rainydio])
-   Skip verification of transactions sent from multisignature wallets ([fcde95442], [@sebastijankuzner])
-   Accept peers in the 2.7 range ([aab40895a], [@faustbrian])
-   Remove obsolete magistrate endpoints (AIP36) ([219a94081], [@air1one])
-   Add aip36 milestone for devnet ([1da58ebb9], [@air1one])
-   Run rollup before publishing to NPM ([b402dbbfd], [@faustbrian])
-   Remove app.events and all of its usages ([35ef5926d], [@rainydio])
-   Remove app.log and all of its usages ([bccf74d2c], [@rainydio])
-   Update `bcrypto` dependency to v5 ([0b5104292], [@faustbrian])
-   Copy over `@hapi/nes` with forked code ([5700867db], [@air1one])
-   Process blocks log line ([4e685146d], [@rainydio])
-   Upgrade typeorm and pg packages ([daf4bb485], [@rainydio])
-   Use shorter default timeouts ([f4025bbc5], [@alessiodf])
-   Better locking ([f0acce87a], [@rainydio])
-   Remove custom wallet repository ([bb8cb1293], [@rainydio])
-   Core-transaction-pool): better readd log ([d65c9de3c], [@rainydio])
-   Log milestone change ([cecf8929e], [@rainydio])
-   Fix configuration and plugin actions ([d0650b1a5], [@sebastijankuzner])
-   Update nsfw 2.0.0 to support node.js 14 ([5ef81ef77], [@rainydio])
-   `getPeerConfig` return plugins information ([a12465527], [@air1one])
-   Support fedora ([a29466e89], [@alessiodf])
-   Update bcrypto dependency ([c74e4ca72], [@sebastijankuzner])
-   CentOS install fixes ([8bd811734], [@adrian69])
-   Refactor(core-snapshot) improve snapshotService interface ([312a1a717], [@sebastijankuzner])
-   Custom validation for postBlock in worker ([247b997d8], [@air1one])
-   Enable assumeChangesOnlyAffectDirectDependencies for TypeScript ([027c6dec9], [@faustbrian])
-   Use `export * as ns` syntax ([04436877f], [@faustbrian])
-   Update @arkecosystem/utils dependency ([76283d336], [@faustbrian])
-   Block and transaction history services ([2038cd5ae], [@rainydio])
-   Fix build status badge ([6a5dc31fd], [@sleepdefic1t])
-   Update dependencies and apply formatting ([e6d579d69], [@faustbrian])
-   Reset missedBlocks before await call ([4831c7a0f], [@air1one])
-   Fix bride -> bridge typo ([82621eeb4], [@alessiodf])
-   Remove core-utils package ([e428af25d], [@faustbrian])
-   Remove app.js from .gitignore ([be37c11ea], [@air1one])
-   Use application events from core-event-emitter ([c2c93f025], [@air1one])
-   Update xstate to v4.8.0 ([50fd560b8], [@alessiodf])
-   Merge index and reindex into one function inside WalletRepository ([af2d8dcf5], [@bertiespell])
-   No default addonBytes for magistrate transactions ([980f3f528], [@air1one])
-   Add exceptions for business resignation ([ba67dbce4], [@air1one])
-   Resolve merge conflicts ([27813b35d], [@faustbrian])
-   Segregate pools by wallets ([2aca6e171], [@rainydio])
-   Define default value for maxTransactionBytes ([77e036629], [@air1one])
-   Bump hapi/joi version to 17.1.0 ([d9b8bc569], [@air1one])
-   Fix lint issues ([68f13e6c6], [@air1one])
-   Fix typescript errors ([0d726edfa], [@air1one])
-   Make bridgechain genesis hash only unique per wallet ([29019ce03], [@air1one])
-   Allow to resign business only when bridgechains are resigned ([fbb82f30e], [@air1one])
-   Allow multiple ports in bridgechain schema ([239f12e14], [@air1one])
-   Setup Wallaby.js configuration ([ac0c0fef6], [@rainydio])
-   Transaction broadcaster ([8fc18c1af], [@rainydio])
-   Processor and errors ([acf34236a], [@rainydio])
-   Remove long dependency ([bf16abde9], [@faustbrian])
-   Remove pm2 from docker ([3ddb098e4], [@adrian69])
-   Wallet repositories ([b87899a57], [@rainydio])
-   Storage ([c558ddde3], [@rainydio])
-   Use findByPublicKey to set both publickey and address on the multisig wallet ([c5284aa4a], [@air1one])
-   Add symbol for TransactionHandlerProvider ([5834847a3], [@sebastijankuzner])
-   Use @arkecosystem/exchange-json-rpc@2.0.0 ([13d7f83e0], [@faustbrian])
-   Update aip11 milestone + update p2p minver defaults ([64fe08c2f], [@air1one])
-   Merge patch from master ([3a6b6555e], [@faustbrian])
-   Timeouts for peer socket messages ([f20abf41c], [@air1one])
-   Re-enable username and 2nd public key as top-level api attributes ([d26701e31], [@air1one])
-   Htlc-lock recipient ([03b51cc6b], [@rainydio])
-   Use ioc for wallet repository indexes ([2eb295d58], [@rainydio])
-   Add ability to inject plugin configuration ([d4acdfe26], [@rainydio])
-   Remove unnecessary termination ([511bc8484], [@alessiodf])
-   Changelog ([03a5d7185], [@air1one])
-   Disable peer check for postBlock/postTransactions ([e8ca52f96], [@air1one])
-   Collator service ([319f778cc], [@rainydio])
-   Enable github tests ([9768a84e7], [@air1one])
-   Ban if remote opens multiple sockets ([bb1d2ebf9], [@air1one])
-   Custom validation for postTransactions as we cant validate with ajv in worker for transactions implemented a "light validation" to quickly discard wrong data this will need to be reworked with p2p for v3 ([b99b08271], [@air1one])
-   Ban if remote opens multiple sockets ([eb021e9ab], [@air1one])
-   Custom validation for postTransactions as we cant validate with ajv in worker for transactions implemented a "light validation" to quickly discard wrong data this will need to be reworked with p2p for v3 ([01e826483], [@air1one])
-   Call `checkNetworkHealth` less deterministically ([dce2a4401], [@alessiodf])
-   Do not include /api prefix in pagination ([49d3660ea], [@air1one])
-   Use wallet repositort with `state=temp` tag instead of temp repository ([1d10acf54], [@rainydio])
-   Tagged pool wallet repository usages state=pool ([f2a5852ad], [@rainydio])
-   Added state=blockchain tag to wallet repository and handler repository references ([72440be8f], [@rainydio])
-   Lifting singleton from transaction handler registry ([357106684], [@rainydio])
-   Stricter eslint configuration ([88219cfd8], [@faustbrian])
-   Change handler dependency handling ([b51793a68], [@rainydio])
-   Align maxPayload / maxTransactionBytes values ([7af9d8fe0], [@air1one])
-   Throw error if multi payment has less than two payments ([427b1e728], [@dated])
-   Make the canEnterTransactionPool() interface more robust ([12e8eb5d5], [@vasild])
-   IoC TransactionHandlerRegistry ([c11af3a12], [@rainydio])
-   Add shared username schema ([8ee148a74], [@dated])
-   Take voteBalance updates out of apply/revert block functions ([e69e33c0e], [@rainydio])
-   Purge ipLastError every hour ([6ab6d6938], [@air1one])
-   Resolve various circular dependencies ([c84b97666], [@faustbrian])
-   Update TypeORM to support PG12 ([905cac2fe], [@faustbrian])
-   Adjust to new infrastructure ([cad345708], [@faustbrian])
-   Setup madge to detect circular dependencies ([82623ff7d], [@faustbrian])
-   Adjust to new infrastructure ([8482282a4], [@faustbrian])
-   Update dependencies ([dc68c251a], [@faustbrian])
-   Document canEnterTransactionPool() ([ee1a13138], [@vasild])
-   Accept address, publicKey, delegate name as business id ([7f07ff0b5], [@dated])
-   Expect actions, jobs and event listeners to be classes ([84c478849], [@faustbrian])
-   Create a real block via block factory ([5a82211f0], [@faustbrian])
-   Create a real wallet via wallet factory ([838ca5de4], [@faustbrian])
-   Expose queue service through a factory pattern ([4f3e8dcee], [@faustbrian])
-   Expose pipeline service through a factory pattern ([6529b1338], [@faustbrian])
-   Expose cache service through a factory pattern ([3eab947dd], [@faustbrian])
-   Expose internals for extension ([243f0bca2], [@faustbrian])
-   Update @hapi dependencies ([1e489b063], [@faustbrian])
-   Remove until a proper rewrite ([f67c9137d], [@faustbrian])
-   Adjust to new infrastructure ([a7f3d03e8], [@faustbrian])
-   Adjust to new infrastructure ([f93a9118d], [@faustbrian])
-   Decouple wallet entity from container ([b3aab122e], [@faustbrian])
-   Fix genesis and exception transactions cache ([647b77fe0], [@rainydio])
-   Flatten contract namespace ([5c3afa4ad], [@faustbrian])
-   Clearly separate event enums by type ([a9241c6ce], [@faustbrian])
-   Rename ActionService to TriggerService ([148e98f19], [@faustbrian])
-   Convert htlc lock vendorfield to string during bootstrap ([1d9dd821d], [@dated])
-   BridgechainUpdate errors ([8d8bb74f4], [@lemii])
-   Refactor searchBusinesses & searchBridgechains ([43ce7dd42], [@dated])
-   Overwrite arrays when merging milestones ([d7e895c03], [@dated])
-   Update docker to node.js 12 ([c88c33251], [@adrian69])
-   Format timestamp of locks ([b96bb4975], [@dated])
-   Print more details in log messages ([f961d053a], [@vasild])
-   Sort peers by height, latency ([4a9afb4a8], [@dated])
-   Update yarn.lock ([67d9cef15], [@faustbrian])
-   Bump minver to next.5 ([99927e77c], [@faustbrian])
-   Better handling Debian/Ubuntu derivatives NodeJS install ([09619ad7f], [@adrian69])
-   Handle Debian/Ubuntu derivate NodeJS install ([0e1308279], [@adrian69])
-   Set minimum fee on transaction types ([d7394e946], [@dated])
-   Simplify resource transformation and response caching ([dfc95a668], [@faustbrian])
-   Pass the booted service provider to boot/disposeWhen ([acc5e16c1], [@faustbrian])
-   Split start into register and boot ([4fc0559ee], [@faustbrian])
-   Split start into register and boot ([6fe1e1e10], [@faustbrian])
-   Split start into register and boot ([3131db9b2], [@faustbrian])
-   Rename enable/disableWhen to boot/disposeWhen ([83c56f15e], [@faustbrian])
-   More verbose static fee mismatch error ([cba7f3bf1], [@dated])
-   Listen to InternalEvents.ServiceProviderBooted for enable/disableWhen ([8ca900069], [@faustbrian])
-   Flatten the Enums namespace ([dbf7a07a8], [@faustbrian])
-   Use transactionId ref in lockTransactionId schema definition ([1619caa47], [@dated])
-   Ship app.json as default configuration ([bc53bce33], [@faustbrian])
-   Remove AttributeService in favour of container bindings ([27668ace7], [@faustbrian])
-   Upgrade TypeScript ESLint to support TypeScript 3.7 ([7d449acb7], [@faustbrian])
-   Add schema for orderBy query param ([9800e34be], [@dated])
-   Use assertion functions from TypeScript 3.7 ([a801c5190], [@faustbrian])
-   Adjust generic name schema ([58fb16093], [@dated])
-   Update to TypeScript 3.7 ([65d98fb8a], [@faustbrian])
-   Move verifySignatures into Transactions.Verifier ([2a8fa004c], [@faustbrian])
-   Validate expiration type based on enum ([7acf6cc3f], [@dated])
-   Add internal contracts and delete obsolete ones ([afd151251], [@faustbrian])
-   Throw AssertionException instead of using assertions ([0a4a659b9], [@faustbrian])
-   Complete IoC migration and adjust tests ([2e7769a9d], [@faustbrian])
-   Unique ipfs hashes ([e462e76d8], [@dated])
-   Add static fee exceptions ([b31d7582a], [@faustbrian])
-   Remove misleading order by expirationValue ([63de81ed2], [@vasild])
-   Add 2.6.0-next.4 as aip11 minimum version ([7d8d8f98d], [@faustbrian])
-   More restrictive wallet id schema ([f8dfefa44], [@dated])
-   Pluralize logs ([65200125e], [@dated])
-   Use URI schema for website an… ([7d216b37c], [@lemii])
-   Improve log message ([9f410eaea], [@vasild])
-   Change MaximumPaymentCountExceededError error ([6b3e0cba7], [@lemii])
-   Don't allow multiple business or bri… ([3877e56cc], [@dated])
-   Fallback to core typegroup if querying by t… ([4787d4461], [@dated])
-   Convert htlc lock vendorfield to string during bootstrap ([95df80297], [@dated])
-   Consolidate bridgechain schem… ([deef78d89], [@lemii])
-   BridgechainUpdate errors ([2c619ae18], [@lemii])
-   Use multiPaymentLimit from milestone if avail… ([0ef251281], [@dated])
-   Refactor searchBusinesses & searchBridgechains ([d579fdaf7], [@dated])
-   Business and bridgechain ids as numbers ([61c4d5f22], [@dated])
-   Use type from core-interfaces ([d00a6a976], [@dated])
-   Generate network configuration with votes and transfers ([196be48ff], [@faustbrian])
-   Support global and local use of attribute stores ([eb52b9494], [@faustbrian])
-   Enable strict mode and fix resulting issues ([c5d360fd1], [@faustbrian])
-   Overwrite arrays when merging milestones ([bf64a68a0], [@dated])
-   Update docker to node.js 12 ([958e6257a], [@adrian69])
-   Format timestamp of locks ([651cf1607], [@dated])
-   Print more details in log messages ([d20f15b2a], [@vasild])
-   Sort peers by height, latency ([03fdf0196], [@dated])
-   Use a map to store attributes ([d1cda3c9c], [@faustbrian])
-   2.6 prereleases after milestone ([1ddcba42d], [@alessiodf])
-   Use node 12 as default version ([8dbe404b8], [@faustbrian])
-   Add core-magistrate-transactions as dependency ([15643452a], [@faustbrian])
-   Updat milestone height ([0dc63ae08], [@faustbrian])
-   Bump @arkecosystem/exchange-json-rpc to 1.0.6 ([7d09120c7], [@faustbrian])
-   Remove remote configuration driver ([a3e9749bb], [@faustbrian])
-   Load core-p2p earlier ([1b28c6d4d], [@alessiodf])
-   Convert BYTEA to/from string ([925f052ce], [@vasild])
-   Make use of more @arkecosystem/utils methods ([8056ef856], [@faustbrian])
-   Update TypeScript configuration ([db0ce174d], [@faustbrian])
-   Resolve plugin configurations from service provider repository ([b13d52d32], [@faustbrian])
-   Make use of more @arkecosystem/utils methods ([b0c57992b], [@faustbrian])
-   Load migration file names automatically ([9a6de2dd9], [@vasild])
-   Integrate hapi-pagination to replace fork ([fddd50014], [@faustbrian])
-   Setup husky and commitlint ([5fa1df36d], [@faustbrian])
-   Leave comments for things that need reviews ([a60734a87], [@faustbrian])
-   Update dependencies to support node.js 12 ([334d59af6], [@faustbrian])
-   Add trailing-slash plugin ([2a81383f4], [@faustbrian])
-   Integrate hapi-pagination to replace fork ([279585be6], [@faustbrian])
-   Use @arkecosystem/utils through @arkecosystem/core-kernel ([6645c1314], [@faustbrian])
-    Split core-marketplace into core-magistrate-crypto and core-magistrate-transactions ([6c6c96c92], [@kovaczan])
-   Don't accept expired v1 transactions ([6bccf660d], [@dated])
-   Remove trailing whitespace ([c218d1a8f], [@vasild])
-   Remove unnecessary check from validateTransactions() ([5fc1e4043], [@vasild])
-   Strengthen a nonce check in performGenericWalletChecks() ([d7dbbec84], [@vasild])
-   Drop node 11 support ([eeb996c64], [@faustbrian])
-   Should not exit on `timedatectl` error. ([2eac04200], [@adrian69])
-   Elaborate the unexpected nonce error ([8ad272ba3], [@vasild])
-   Use cloneDeep, snakeCase and camelCase from @arkecosystem/utils ([3a34308e3], [@faustbrian])
-   Temporarily deprecate core-elasticsearch ([8697d1dae], [@faustbrian])
-   Make use of IoC in blockchain, p2p and transaction pool ([8059fb51c], [@faustbrian])
-   Always check for updates when something runs ([41a869a44], [@faustbrian])
-   Replace proxy services with container bindings ([5d7d3d6cc], [@faustbrian])
-   Remove lodash dependencies & general housekeeping ([3c12f5a18], [@faustbrian])
-   Break wallet manager into repository & state management ([b2271ceb8], [@faustbrian])
-   Deprecate core-explorer ([d98ada544], [@faustbrian])
-   Deprecate core-exchange-json-rpc and core-http-utils ([7116976d3], [@faustbrian])
-   Remove the abstract logger ([bb528bf6e], [@faustbrian])
-   Deprecate core-vote-report ([c97357c76], [@faustbrian])
-   Deprecate core-tester-cli ([789fdb70e], [@faustbrian])
-   Deprecate core-wallet-api ([6a1f5c1d9], [@faustbrian])
-   Merge server utils into an HttpServer class ([d5821761c], [@faustbrian])
-   Adapt to new container ([eceab20f0], [@faustbrian])
-   Merge core-utils ([56850c56e], [@faustbrian])
-   Adapt to new container ([67b10ddcd], [@faustbrian])
-   Deprecate core-error-tracker* packages ([0c03165da], [@faustbrian])
-   Implement RFC 5424 log levels ([c61372885], [@faustbrian])
-   Deprecate core-logger-signale and core-logger-winston ([ab8cc65a5], [@faustbrian])
-   Move deprecated plugins to ArkEcosystem/core-plugins-deprecated ([33d8ba754], [@faustbrian])
-   Guarantee package order in config through arrays ([dc4bc4edf], [@faustbrian])
-   Drop node 10 from CircleCI and update .nvmrc to node 11 ([8836016ea], [@faustbrian])
-   Simplify action implementation and remove awilix ([75199f713], [@faustbrian])
-   Apply builder pattern to events service ([e6c9e9b6a], [@faustbrian])
-   Use symbols to avoid name clashes in container ([5f4c6e8c4], [@faustbrian])
-   Use object destructuring for event listeners ([d6a42f2e5], [@faustbrian])
-   Add container helper methods ([050ce16b1], [@faustbrian])
-   Group container and provider logic ([58478848a], [@faustbrian])
-   Setup documentation generation with TypeDoc ([01e47446b], [@faustbrian])
-   Replace tslint with typescript-eslint ([f407903b6], [@faustbrian])
-   Organise contracts and exceptions into namespaces ([aec0f5ad3], [@faustbrian])
-   Container friendly naming of bindings ([7c402ac2b], [@faustbrian])
-   Migrate plugin entry from objects to service providers ([0c55ea134], [@faustbrian])
-   Remove deprecated folder ([d0c299ebb], [@faustbrian])
-   Clean slate for integration and unit tests ([659b881b1], [@faustbrian])

### Fixed

-   Fix `/api/lock/unlocked` payload validation ([72562a63e], [@rainydio])
-   Get xstate action name ([62e1235b8], [@sebastijankuzner])
-   Don't ignore server error in accepted matcher ([8cb27d6b5], [@rainydio])
-   Re-throw errors as pool error ([5bb8a1bc1], [@rainydio])
-   Respect block.maxPayload milestone limit ([703651f37], [@rainydio])
-   Compare transaction.serialized.length with maxTransactionBytes ([b41d4324d], [@rainydio])
-   Plugin:install/remove/update commands ([9c1836f63], [@sebastijankuzner])
-   Forge custom transactions ([f7139551d], [@rainydio])
-   Use force flag on update ([deac1569e], [@sebastijankuzner])
-   Resolve commands path ([87ee3b595], [@sebastijankuzner])
-   Remove CORE_SKIP_BLOCKCHAIN flag ([14d162df4], [@sebastijankuzner])
-   Handle errors on removeBlocks ([4a632853b], [@sebastijankuzner])
-   Reset max payload after ping ([4dd78ddeb], [@rainydio])
-   Disable perMessageDeflate on WS ([7a6d1987a], [@sebastijankuzner])
-   Debug scripts ([b5f4932b3], [@sebastijankuzner])
-   Parse peers from URL response ([94d0c586f], [@sebastijankuzner])
-   Fix rollback condition ([8cde7613a], [@rainydio])
-   Set max payload for whole forger connection ([39c2fa9b9], [@rainydio])
-   Iterate over active delegates who have ranks ([d634a9280], [@rainydio])
-   Remove bad line ([5d34297d7], [@sleepdefic1t])
-   Split log files per process ([71db9fff7], [@sebastijankuzner])
-   Server logs ([d955559c2], [@sebastijankuzner])
-   Rollback database ([b5ac4b077], [@sebastijankuzner])
-   DeserializeTransactionsUnchecked ([a0f929d03], [@sebastijankuzner])
-   Improve sorting performance ([6fec5b2ea], [@rainydio])
-   Improve ExceptionHandler ([6c62abe3d], [@sebastijankuzner])
-   Remove BlockNotReadyCounter on Unchained handler ([2ab4c84a5], [@sebastijankuzner])
-   Use blockchain DposState ([9d4733525], [@sebastijankuzner])
-   Missing dependency logs ([fad6ea915], [@sebastijankuzner])
-   Calculate previous round ([0f40e5178], [@sebastijankuzner])
-   Support zip archive download ([71f819494], [@sebastijankuzner])
-   LastBlockHeightInRound computation ([905c191de], [@air1one])
-   Keep previously forged transaction ([278933113], [@rainydio])
-   Prioritized removeForgedTransaction ([ee8c5e3f3], [@rainydio])
-   Save .env content in valid format ([97aad10e4], [@sebastijankuzner])
-   Revert block ([e699b4d78], [@sebastijankuzner])
-   Vote dispatchEvents for all changes ([6f5966ad7], [@sebastijankuzner])
-   Accept only verified transactions ([4e3925c79], [@sebastijankuzner])
-   Fix rate limit plugin headers ([af12a265e], [@rainydio])
-   Remove connection from list onError ([219e73274], [@sebastijankuzner])
-   Dispose server ([7c27eda66], [@sebastijankuzner])
-   Eliminate collator pool clean ([17ec422a8], [@rainydio])
-   Cache status code and headers ([00f479aad], [@rainydio])
-   Use internal Hapi routes ([5d6266669], [@sebastijankuzner])
-   Hard limit number of txs in codec ([f57b56c4a], [@air1one])
-   Help output message and --help flag ([58ac94cb8], [@sebastijankuzner])
-   Handle stream errors ([fd1cbec19], [@sebastijankuzner])
-   Handle stream errors on log generatiton ([25d094377], [@sebastijankuzner])
-   Syntax in setMaxPayload ([92792750f], [@air1one])
-   Do not consume when just checking rate limit ([8ea0ed494], [@air1one])
-   Respect aip36 milestone in handlers ([bebde8efc], [@sebastijankuzner])
-   Validate htlc-lock recipient network ([210b419c3], [@rainydio])
-   Override array on merge ([e9cee040d], [@sebastijankuzner])
-   Vote balance tests and fixes ([2123ed2ff], [@rainydio])
-   Vote+unvote transaction vote balance ([b6db22c88], [@rainydio])
-   Explicit check against undefined ([ad9418fb1], [@air1one])
-   Move migration to correct location ([ddd2cbf12], [@air1one])
-   Import fix ([00545a3ad], [@sebastijankuzner])
-   Broadcast only new blocks ([730347de8], [@sebastijankuzner])
-   Check later ([1ceb1c2eb], [@sebastijankuzner])
-   Await deamonizeProcess on start commnands ([084d2da14], [@sebastijankuzner])
-   Remove duplicate connect ([8948090fd], [@air1one])
-   Set large max payload value ([cf712bfd6], [@air1one])
-   Do not terminate when app not ready ([68272904d], [@air1one])
-   Entity insufficient balance ([b0c003c08], [@rainydio])
-   Set file log level to debug ([710cb1756], [@sebastijankuzner])
-   Respect max transaction age setting ([bc4521963], [@rainydio])
-   Download blocks log message when no blocks are returned ([ed5ad9120], [@air1one])
-   TrustProxy option based on env ([fff3ecb01], [@air1one])
-   Limit peers returned by getPeers ([4c79c455a], [@air1one])
-   Reduce getBlocksTimeout to 30 sec ([93701759e], [@air1one])
-   Reset maxPayload on ws message ([f1bf19566], [@air1one])
-   Count props in p2p.peer.postTransactions payload ([021d18aa0], [@alessiodf])
-   Optional core-snapshots dependency when process is not manager ([58a66aa50], [@sebastijankuzner])
-   Append --env=test to full:testnet script ([a5779110a], [@sebastijankuzner])
-   Fix potential locking issue ([9747942aa], [@rainydio])
-   Validate incoming message json ([ae8dcd734], [@alessiodf])
-   Ensure asset recipientId and amount are strings ([29eaf1043], [@alessiodf])
-   Check client-side graceful disconnection payload ([c6d74215a], [@alessiodf])
-   Validate payload call id for all requests ([4565eba2b], [@alessiodf])
-   Reject long form signature lengths ([8f8976deb], [@alessiodf])
-   Detect missed blocks ([a2389816e], [@sebastijankuzner])
-   Generate genesis block with id full sha256 ([a476cb095], [@air1one])
-   Install peer dependencies during update ([6c7fea0da], [@rainydio])
-   Respect channel version ([0cbd90eec], [@sebastijankuzner])
-   Try all possible peers before giving up (block download) ([9009863c8], [@air1one])
-   Parse without base64ToBinaryReplacer on error ([8e41f0691], [@alessiodf])
-   Terminate and ban on error ([eecc40cec], [@air1one])
-   Always broadcast last block ([c291166f8], [@air1one])
-   Database connection and minor fixes ([43da7d719], [@sebastijankuzner])
-   Remove `transactions` field from block when requesting with `headersOnly` ([31f9407a0], [@air1one])
-   Restore accept peer plugin ([242f8b479], [@rainydio])
-   Add request method as part of cache key ([4e8f5c1ca], [@sebastijankuzner])
-   Network:generate save to default location ([3c0c4eb3e], [@sebastijankuzner])
-   Re-add transactions after state builder finished ([9c19a7a71], [@rainydio])
-   Delete all rounds starting from `round` ([b082935d0], [@rainydio])
-   Fix peer connecting to itself ([4a825d16a], [@rainydio])
-   Set adequate autovacuum settings ([fbbda7bff], [@rainydio])
-   Use set config when loading cryptography ([65b09802f], [@sebastijankuzner])
-   Don't rollback transaction that failed to start ([12f0a7795], [@rainydio])
-   Filter asset by original or cast values ([1d03a2c51], [@rainydio])
-   Count performance ([d0d98f8fc], [@rainydio])
-   Log only once when app is not ready ([4eb14eecc], [@sebastijankuzner])
-   Log fatal errors ([ebe038d69], [@sebastijankuzner])
-   Clear request on timeout ([76aebaed3], [@sebastijankuzner])
-   Do not await tx broadcast in processor ([ba0b44302], [@air1one])
-   Strict greater than ([8006a8da3], [@air1one])
-   Htlc lock recipientId is required ([380fb5b60], [@air1one])
-   Ban if not authorized on internal ([dd96ee491], [@air1one])
-   Check that message is a string ([5e1c5a330], [@air1one])
-   Fork recovery ([2eadff3ce], [@sebastijankuzner])
-   Run state builder after database integrity ([7cf044089], [@air1one])
-   Respond with error when blockchain is not ready ([d44e7e17b], [@air1one])
-   Update vote balance for each asset vote ([361ddabae], [@rainydio])
-   Fix block returned by api by either id or height ([214dec2c4], [@rainydio])
-   Don't spam dynamic fee messages ([7c071051b], [@rainydio])
-   Fix unvote+vote bootstrap ([75e9c2130], [@rainydio])
-   Don't throw forgetting undefined attribute ([e8fb5f946], [@rainydio])
-   Block download ([da2e5639d], [@sebastijankuzner])
-   Destroy connection after terminate ([a853d63ff], [@air1one])
-   Rate limit and peer broadcast ([6988cdd4a], [@air1one])
-   Use getRegisteredHandlers() to get all registered handlers in /node/fees controller ([a917e0853], [@air1one])
-   Slot, round and forgingInfo calculation for dynamic block times ([2d3fe0914], [@sebastijankuzner])
-   Initialize maxPayload on connection create ([3ac3eb17e], [@air1one])
-   Stricter multipayment tx check ([620027df0], [@air1one])
-   Only verify peer blocks < our height and disable peer verifier caching ([c968e69d5], [@air1one])
-   Delegate check only needed on entity register ([64b63b54c], [@air1one])
-   Wallet repository clone instantiation ([2fb47e6de], [@rainydio])
-   Fix delegate.lastBlock.timestamp property ([66f39cb4f], [@rainydio])
-   Use head from utils ([da13465ea], [@air1one])
-   Entity name only unique by type ([3b12c7037], [@air1one])
-   Clone wallet on mempool wallet-repository ([140b860fc], [@sebastijankuzner])
-   Replace micromatch with nanomatch ([4387b1dfb], [@sebastijankuzner])
-   Decouple database and state packages ([af5e54233], [@bertiespell])
-   Dynamically import @pm2/io ([4fc57db60], [@sebastijankuzner])
-   RevertBlock ([3565ef51b], [@sebastijankuzner])
-   Fix delegate search order ([f21af3704], [@rainydio])
-   Limit parameter (rollback #3940) ([39894a40d], [@rainydio])
-   Find by address / public key before username ([ddd19cc2d], [@air1one])
-   Check sig length value vs r/s length ([c2d3f2e5f], [@air1one])
-   Discard zero-padded R/S ([9f197fa11], [@air1one])
-   Fix order in delegates/{id}/blocks ([50492b454], [@rainydio])
-   Fix transactions/${id} confirmations and timestamp fields ([a7b46a906], [@rainydio])
-   Manually apply b0296e765700d0dc7c0356770bd3941da1609660 ([abfe43f8c], [@air1one])
-   Limit max retries form infinity to 1 ([184f5007f], [@sebastijankuzner])
-   Disconnect all sockets on peer disconnect ([95d6b2c2c], [@sebastijankuzner])
-   Expose two methods for findByHeightRangeWithTransactions ([dc431faff], [@sebastijankuzner])
-   Check that R and S is positive ([0783ec08d], [@air1one])
-   Check sig length vs R and S length ([1b0863c38], [@air1one])
-   Allow to discard possibly invalid txs from pool ([0450ee842], [@air1one])
-   Stricter rate limit for getBlocks ([df7a3aa15], [@air1one])
-   Ping ports using head ([db226bd3a], [@air1one])
-   Reduce download block size when getting no block ([e22328753], [@air1one])
-   Sort transactions by sequence before saving block ([cd29f850e], [@sebastijankuzner])
-   Reset peer errorCounter after response ([1e7d11d46], [@sebastijankuzner])
-   Remove unnecessary assertion check to enable devnet sync ([381e9c7ae], [@bertiespell])
-   Uses new promise instead Promise.race ([915263a27], [@sebastijankuzner])
-   Guaranteed transaction order ([110ada8df], [@rainydio])
-   Allow dynamic fees ([2400b8df8], [@bertiespell])
-   Remove obsolete check (unique per wal ([d9c8b070c], [@air1one])
-   Handle when there is no business.bridgechains ([14a3af3af], [@air1one])
-   Version 1 multi-signature handler should check milestone data ([74e1e3790], [@bertiespell])
-   Re-add unconfirmed matcher ([7123ff20a], [@air1one])
-   Remove duplicates entity resigned/isResigned ([90bf42de3], [@air1one])
-   Entity handler bootstrap method, fetch transactions using asset type/subType as number ([4031a51da], [@air1one])
-   Ensure peer port is always an integer to avoid socket validation errors ([4e7cca1f3], [@bertiespell])
-   Stream transactions during bootstrap ([8a6be81d8], [@rainydio])
-   Restrict internal routes to whitelisted IPs ([34672893b], [@bertiespell])
-   Union type with number in pool query ([cf43417e2], [@rainydio])
-   Respect CORE_API_RATE_LIMIT_DISABLED env variable ([c7d8242f3], [@rainydio])
-   Fix entity register bootstrap method ([bd5b1ad03], [@air1one])
-   Fix entity bootstrap methods ([89a7176fd], [@air1one])
-   Transaction builder should build and sign versioned transactions ([93937b286], [@bertiespell])
-   Prevent watcher from calling app.reboot multiple times ([0d4b21020], [@rainydio])
-   InitializeActiveDelegates just use current round ([7fa7af259], [@air1one])
-   Return serialized transactions ([7e369b186], [@air1one])
-   Fix round order ([9921a0d1e], [@rainydio])
-   Fix delete blocks ([b2fee486a], [@rainydio])
-   Transaction filter multipayment recipientId ([70700fa2c], [@rainydio])
-   Block schema violation ([54ba2d211], [@air1one])
-   Handle transaction deserialize error ([09e089277], [@rainydio])
-   Return last common block ([b21960971], [@sebastijankuzner])
-   Rebuild vs update race ([507f8112f], [@rainydio])
-   Replace ws connection logging method ([3525e8609], [@sebastijankuzner])
-   Log all unexpected errors ([9fc047a1f], [@rainydio])
-   Fix transaction resource responses ([b3e0b984a], [@rainydio])
-   Re-add transactions to pool when milestone changes ([eddb726ff], [@rainydio])
-   Set default orderBy value ([9ea9bb4e6], [@rainydio])
-   Introduce CORE_RESET_POOL env variable ([ba49d8797], [@rainydio])
-   Use hapi inject when creating transfer transaction ([3ac7a0345], [@rainydio])
-   Straight delete blocks during rollback ([b87a7a8a6], [@rainydio])
-   Round deletion when deleting blocks ([62f5ae962], [@rainydio])
-   Fix wallet/transactions confirmations and timestamp fields ([666ba6787], [@rainydio])
-   Include multipayment in forged amount ([3439e5283], [@rainydio])
-   Handle multipayment recipientId during search ([67ae0c811], [@rainydio])
-   Discard late-forged blocks from forger ([36b5115b9], [@air1one])
-   Throw ERR_HIGH_FEE when fee is too high ([8a383b8dd], [@sebastijankuzner])
-   Get app version from package.json ([56107062d], [@air1one])
-   Show log levels <= defined threshold level ([e1921baa9], [@air1one])
-   Use sorted array (instead of tree) for storing transactions by fee and nonce ([e0b1431ea], [@air1one])
-   Update vote balance with htlc locked balance on vote transactions ([b0296e765], [@air1one])
-   Create a unique round ID ([5911c7cd5], [@faustbrian])
-   Import scope ([37cb56efc], [@kovaczan])
-   Add check in config-cli command to check whether the token flag has been set ([94c2da2b7], [@bertiespell])
-   Blockchain and p2p fixes to be able to launch a network ([e97a18aed], [@air1one])
-   Allow transition to fork from idle ([f779485a7], [@air1one])
-   Change import scope from @package to @arkecosystem ([606faac84], [@kovaczan])
-   Log warning when active delegates are under the required delegate count ([937ffa087], [@bertiespell])
-   Block incomplete sockets ([f1c35f3a9], [@air1one])
-   AcceptBlockHandler apply block to tx pool before db ([21436df52], [@air1one])
-   Add missing transactions.type_group index ([5bf4e5901], [@faustbrian])
-   Always call applyToRecipient ([509db52aa], [@air1one])
-   Jemalloc compatibility for ubuntu 16.04 ([64084a0aa], [@alessiodf])
-   Handle multiple installations of jemalloc ([b7e639842], [@alessiodf])
-   Set height 1 on config manager for processing genesis block (blockchain replay) ([31eb27a2a], [@air1one])
-   Undefined pool variable ([9a8ecde92], [@rainydio])
-   Allow string and number for rewardAmount ([f7c474109], [@faustbrian])
-   Enable HTLC by default ([37728bdc1], [@faustbrian])
-   Add username and secondPublicKey to wallet resource ([c12064dc7], [@faustbrian])
-   CalculateLockExpirationStatus method signature ([fc6720206], [@faustbrian])
-   Adjust transaction factory for custom network configurations ([ab27881a4], [@faustbrian])
-   Use Joi.object() in schema definition ([2a325d197], [@air1one])
-   Only accept valid http path (SC http server) ([f6462ef68], [@air1one])
-   Disable permessage-deflate ([7bbd962dd], [@alessiodf])
-   Make app.js optional as initially intended ([9f5785e5c], [@faustbrian])
-   Check for missed blocks before applying round ([6d4c00a9a], [@alessiodf])
-   Multisig legacy allow signatures property ([454a125a4], [@air1one])
-   Apply genesis wallet exception to lastForgedBlocks ([6dbae81e1], [@air1one])
-   Set network height on configManager ([481d59f9f], [@air1one])
-   Pass IBlockData to processBlocks instead of IBlock ([117bb9e2c], [@air1one])
-   Handle p2p edge cases ([1d3614dee], [@faustbrian])
-   Remove banning when peer opens multiple sockets ([16af15d69], [@air1one])
-   Edge cases handling ([99eded0c7], [@faustbrian])
-   Stop processing blocks containing too many transactions ([4b43552e5], [@air1one])
-   Disconnect existing connections from the same ip ([a02d3ca38], [@air1one])
-   Block invalid opcode packets ([5b49532b6], [@air1one])
-   Disconnect if event does not have a defined handler ([a324bf344], [@air1one])
-   Block payload with additional props ([99fc27820], [@air1one])
-   Stop processing blocks containing too many transactions ([dcfa1be7d], [@alessiodf])
-   Disconnect existing connections from the same ip ([ebbe5ae7c], [@alessiodf])
-   Block invalid opcode packets ([4c5e6f1c9], [@alessiodf])
-   Disconnect if event does not have a defined handler ([fb16e931c], [@alessiodf])
-   Block payloads with additional properties ([8461c9cde], [@alessiodf])
-   Allow legacy transaction in getBlocksForRound ([16446a145], [@air1one])
-   Master merge fixes for core-p2p worker ([bc71013fc], [@air1one])
-   Handle disconnect packets ([5c0c439a7], [@air1one])
-   Business/bridgechain update handlers - revertForSender ([7dc219a62], [@air1one])
-   Use parent findByPublicKey method for temp-wallet-manager ([8494784b3], [@air1one])
-   Don't assume blocksInCurrentRound is defined ([b15387132], [@vasild])
-   Throw error instead of omitting long vendorField values ([bde4e4cd0], [@lemii])
-   Businesses/bridgechains search by name ([33256dbe9], [@dated])
-   Handle forgedTotal and voteBalance in orderBy query param ([c84943a94], [@dated])
-   Update sender's wallet after validation ([92c31bee8], [@rainydio])
-   Issues after merge ([8bea92418], [@faustbrian])
-   Search by genesisHash in show method ([2ab33be68], [@dated])
-   Parallel download ([80d6712b4], [@vasild])
-   Emit correct event ([02a575ca8], [@dated])
-   Use numerics for typeGroups in /transactions/typ… ([c199cd803], [@vasild])
-   Properly terminate bad connections ([6f7b54cf8], [@alessiodf])
-   Use strict comparison to decide if a transaction should be enabled ([27abce8e6], [@faustbrian])
-   Use wallet publicKey for business id index ([3416b86a6], [@air1one])
-   Remove password flag constraint for core:forger command ([5aea54f32], [@faustbrian])
-   Don't swallow BIP38 errors ([f3dcb1f36], [@faustbrian])
-   Use genesisHash for bridgechainId ([12869b386], [@air1one])
-   Wallet-manager fallback to database wallet manager findByIndex() when no "local" match ([9c9e7b336], [@air1one])
-   Replace ipfs exception ([8f028f8ca], [@dated])
-   Do not attempt to convert vendorfield ([0663b0ff8], [@dated])
-   Adjust genericName regex and add tests ([89fc75762], [@dated])
-   Return early only if there are rows ([ee802a06d], [@dated])
-   Include query in wallets/{id}/locks cache ([0257c3c44], [@dated])
-   Case insensitive bridgechain comparison ([c6b31eb86], [@dated])
-   Add additional bridgechain registration exception handling ([98522ea19], [@dated])
-   Add ipfs exception handling ([159098b08], [@dated])
-   Check for an exception before checking for invalid fees ([3863d6eb3], [@faustbrian])
-   Stricter WS/SC events/messages handling ([cb2c9a399], [@air1one])
-   Handle unwanted control frames ([cecf2f97b], [@alessiodf])
-   Stricter WS/SC events/messages handling ([ef796f975], [@faustbrian])
-   Stricter WS/SC events/messages handling ([2854dc9f1], [@air1one])
-   Handle unwanted control frames ([a8f88db7d], [@alessiodf])
-   Allow unvoting a resigned delegate ([f361a796c], [@dated])
-   Prevent snapshot commands from running if core is running ([1b3c5b6f6], [@faustbrian])
-   Remove delegate.rank for resigned delegates ([f284b4bea], [@vasild])
-   Reindex wallet when applying delegate resignation ([12ec1a22e], [@dated])
-   Call next() so that the request can proceed ([14b64899b], [@air1one])
-   Correctly reduce indexed bridgechain entries ([8b64f7f50], [@dated])
-   Properly implement block size limit ([4bbfaa22a], [@vasild])
-   Improve 'name' field validation to… ([e67abe70d], [@lemii])
-   Get connection from databaseservice ([0081a2fd2], [@dated])
-   Parallel download ([98def5ab5], [@vasild])
-   Emit correct event ([5ef8fc8a8], [@dated])
-   Use numerics for typeGroups in /transactions/typ… ([7d1809290], [@vasild])
-   Properly terminate bad connections ([cbd4abc21], [@alessiodf])
-   Use strict comparison to decide if a transaction should be enabled ([13808e09f], [@faustbrian])
-   Respect the include and exclude rules of the CLI ([6c41a0832], [@faustbrian])
-   Resolve issues and conflicts after 2.6 merge ([6a1f8d2b8], [@faustbrian])
-   Add missing offset handling to /api/peers ([3bcc8fae3], [@faustbrian])
-   Use the request origin to avoid 404s ([98c88c400], [@faustbrian])
-   Activate AIP11 at height 2 on testnet to avoid genesis collision ([2ca694f9c], [@faustbrian])
-   Strengthen schema validation checks ([12d5f031b], [@vasild])
-   Resolve issues and conflicts after 2.6 merge ([bfa2c2827], [@faustbrian])
-   Store vendor field in bytea ([63dc25257], [@vasild])
-   Convert isAppReady response to object ([892a6105f], [@alessiodf])
-   Basic validation on incoming p2p data + terminate socket on error ([92e01152d], [@air1one])
-   Use correct IV length for encryption ([2aad9efd4], [@faustbrian])
-   Match the long version of bytebuffer ([516a58619], [@faustbrian])
-   Export/import transactions' type_group ([7aaa14343], [@vasild])
-   Remove bogus skipRoundRows ([77cc8d7c7], [@vasild])
-   Range selection in pool's getTransactions() ([84aedb1b4], [@vasild])
-   Htlc refund handler to use performGenericWalletChecks (+ fix e2e tests) ([ec2002d48], [@air1one])
-   Terminate connection when not authorized ([0dce18971], [@faustbrian])
-   Disconnect external connections to internal endpoints ([f73bd8bbb], [@alessiodf])
-   Sort by fee, nonce ([298117628], [@vasild])
-   Htlc lock buffer allocation ([5f7ca208c], [@kovaczan])
-   Use postgresql-9.5 compatible syntax ([37e8f52ae], [@vasild])
-   Terminate blocked client connections ([76f06acaa], [@alessiodf])
-   Drop connections with malformed messages ([5ac0c41b0], [@alessiodf])
-   Only shift milestoneHeights[] if at that height ([56ff979db], [@vasild])
-   Cast params in condition checks ([8e8034044], [@dated])
-   Move wallet manager "zero balance" check to transaction handlers ([8c773dab4], [@air1one])
-   Cast params in condition checks ([1016bd5fa], [@dated])
-   Transaction pool options access ([29e8485f8], [@faustbrian])
-   Resolve logger as log from container ([daf1d922a], [@faustbrian])
-   Get the basics running again ([53e4469f3], [@faustbrian])
-   Resolve build issues after core-kernel introduction ([e8a2d6bea], [@faustbrian])
-   Update core-interfaces imports to core-kernel ([c70bf0bb7], [@faustbrian])


[@adrian69]: https://github.com/adrian69
[@air1one]: https://github.com/air1one
[@alessiodf]: https://github.com/alessiodf
[@bertiespell]: https://github.com/bertiespell
[@dated]: https://github.com/dated
[@faustbrian]: https://github.com/faustbrian
[@kovaczan]: https://github.com/kovaczan
[@lemii]: https://github.com/lemii
[@rainydio]: https://github.com/rainydio
[@sebastijankuzner]: https://github.com/sebastijankuzner
[@sleepdefic1t]: https://github.com/sleepdefic1t
[@supaiku]: https://github.com/supaiku
[@vasild]: https://github.com/vasild
[013b6b015]: https://github.com/ARKEcosystem/core/commit/013b6b015
[b7f62ef34]: https://github.com/ARKEcosystem/core/commit/b7f62ef34
[51539e1b1]: https://github.com/ARKEcosystem/core/commit/51539e1b1
[e7953c241]: https://github.com/ARKEcosystem/core/commit/e7953c241
[50f25c74d]: https://github.com/ARKEcosystem/core/commit/50f25c74d
[72562a63e]: https://github.com/ARKEcosystem/core/commit/72562a63e
[d41d65c93]: https://github.com/ARKEcosystem/core/commit/d41d65c93
[4ca684c97]: https://github.com/ARKEcosystem/core/commit/4ca684c97
[62e1235b8]: https://github.com/ARKEcosystem/core/commit/62e1235b8
[8cb27d6b5]: https://github.com/ARKEcosystem/core/commit/8cb27d6b5
[865f2d066]: https://github.com/ARKEcosystem/core/commit/865f2d066
[600ca0456]: https://github.com/ARKEcosystem/core/commit/600ca0456
[5bb8a1bc1]: https://github.com/ARKEcosystem/core/commit/5bb8a1bc1
[063e92923]: https://github.com/ARKEcosystem/core/commit/063e92923
[1f259ae31]: https://github.com/ARKEcosystem/core/commit/1f259ae31
[703651f37]: https://github.com/ARKEcosystem/core/commit/703651f37
[b41d4324d]: https://github.com/ARKEcosystem/core/commit/b41d4324d
[92f22448b]: https://github.com/ARKEcosystem/core/commit/92f22448b
[9b59a20ee]: https://github.com/ARKEcosystem/core/commit/9b59a20ee
[464fc9aad]: https://github.com/ARKEcosystem/core/commit/464fc9aad
[0bf55c252]: https://github.com/ARKEcosystem/core/commit/0bf55c252
[9c1836f63]: https://github.com/ARKEcosystem/core/commit/9c1836f63
[c017e1a83]: https://github.com/ARKEcosystem/core/commit/c017e1a83
[3c757e9c1]: https://github.com/ARKEcosystem/core/commit/3c757e9c1
[5051dcea9]: https://github.com/ARKEcosystem/core/commit/5051dcea9
[f7139551d]: https://github.com/ARKEcosystem/core/commit/f7139551d
[deac1569e]: https://github.com/ARKEcosystem/core/commit/deac1569e
[87ee3b595]: https://github.com/ARKEcosystem/core/commit/87ee3b595
[c1af74dca]: https://github.com/ARKEcosystem/core/commit/c1af74dca
[14d162df4]: https://github.com/ARKEcosystem/core/commit/14d162df4
[4a632853b]: https://github.com/ARKEcosystem/core/commit/4a632853b
[4dd78ddeb]: https://github.com/ARKEcosystem/core/commit/4dd78ddeb
[7a6d1987a]: https://github.com/ARKEcosystem/core/commit/7a6d1987a
[13d070919]: https://github.com/ARKEcosystem/core/commit/13d070919
[b5f4932b3]: https://github.com/ARKEcosystem/core/commit/b5f4932b3
[7a6a4e9a4]: https://github.com/ARKEcosystem/core/commit/7a6a4e9a4
[94d0c586f]: https://github.com/ARKEcosystem/core/commit/94d0c586f
[689d62941]: https://github.com/ARKEcosystem/core/commit/689d62941
[8cde7613a]: https://github.com/ARKEcosystem/core/commit/8cde7613a
[39c2fa9b9]: https://github.com/ARKEcosystem/core/commit/39c2fa9b9
[aef8a3848]: https://github.com/ARKEcosystem/core/commit/aef8a3848
[d634a9280]: https://github.com/ARKEcosystem/core/commit/d634a9280
[5d34297d7]: https://github.com/ARKEcosystem/core/commit/5d34297d7
[71db9fff7]: https://github.com/ARKEcosystem/core/commit/71db9fff7
[d955559c2]: https://github.com/ARKEcosystem/core/commit/d955559c2
[b5ac4b077]: https://github.com/ARKEcosystem/core/commit/b5ac4b077
[a0f929d03]: https://github.com/ARKEcosystem/core/commit/a0f929d03
[6fec5b2ea]: https://github.com/ARKEcosystem/core/commit/6fec5b2ea
[b158513cc]: https://github.com/ARKEcosystem/core/commit/b158513cc
[6c62abe3d]: https://github.com/ARKEcosystem/core/commit/6c62abe3d
[ba386e3a1]: https://github.com/ARKEcosystem/core/commit/ba386e3a1
[2ab4c84a5]: https://github.com/ARKEcosystem/core/commit/2ab4c84a5
[89975ab67]: https://github.com/ARKEcosystem/core/commit/89975ab67
[9d4733525]: https://github.com/ARKEcosystem/core/commit/9d4733525
[fad6ea915]: https://github.com/ARKEcosystem/core/commit/fad6ea915
[0f40e5178]: https://github.com/ARKEcosystem/core/commit/0f40e5178
[71f819494]: https://github.com/ARKEcosystem/core/commit/71f819494
[905c191de]: https://github.com/ARKEcosystem/core/commit/905c191de
[278933113]: https://github.com/ARKEcosystem/core/commit/278933113
[ee8c5e3f3]: https://github.com/ARKEcosystem/core/commit/ee8c5e3f3
[56111ed1d]: https://github.com/ARKEcosystem/core/commit/56111ed1d
[83bb890d9]: https://github.com/ARKEcosystem/core/commit/83bb890d9
[97aad10e4]: https://github.com/ARKEcosystem/core/commit/97aad10e4
[4f6cc0bed]: https://github.com/ARKEcosystem/core/commit/4f6cc0bed
[eb1bb6be9]: https://github.com/ARKEcosystem/core/commit/eb1bb6be9
[838d897ff]: https://github.com/ARKEcosystem/core/commit/838d897ff
[986d86a0c]: https://github.com/ARKEcosystem/core/commit/986d86a0c
[8074203b7]: https://github.com/ARKEcosystem/core/commit/8074203b7
[9724ff42c]: https://github.com/ARKEcosystem/core/commit/9724ff42c
[e699b4d78]: https://github.com/ARKEcosystem/core/commit/e699b4d78
[0b9b54915]: https://github.com/ARKEcosystem/core/commit/0b9b54915
[a304173a9]: https://github.com/ARKEcosystem/core/commit/a304173a9
[3e79f9cd5]: https://github.com/ARKEcosystem/core/commit/3e79f9cd5
[bebe9522a]: https://github.com/ARKEcosystem/core/commit/bebe9522a
[6f5966ad7]: https://github.com/ARKEcosystem/core/commit/6f5966ad7
[1d5a5c524]: https://github.com/ARKEcosystem/core/commit/1d5a5c524
[04a1bbae7]: https://github.com/ARKEcosystem/core/commit/04a1bbae7
[4596c85ea]: https://github.com/ARKEcosystem/core/commit/4596c85ea
[9a3d9ee7e]: https://github.com/ARKEcosystem/core/commit/9a3d9ee7e
[bed6bef47]: https://github.com/ARKEcosystem/core/commit/bed6bef47
[4e3925c79]: https://github.com/ARKEcosystem/core/commit/4e3925c79
[c08ebd4f2]: https://github.com/ARKEcosystem/core/commit/c08ebd4f2
[a030900fe]: https://github.com/ARKEcosystem/core/commit/a030900fe
[af12a265e]: https://github.com/ARKEcosystem/core/commit/af12a265e
[e911c9b65]: https://github.com/ARKEcosystem/core/commit/e911c9b65
[219e73274]: https://github.com/ARKEcosystem/core/commit/219e73274
[9e079053b]: https://github.com/ARKEcosystem/core/commit/9e079053b
[9cc883b6d]: https://github.com/ARKEcosystem/core/commit/9cc883b6d
[2b9a4125b]: https://github.com/ARKEcosystem/core/commit/2b9a4125b
[3b2f5eb0f]: https://github.com/ARKEcosystem/core/commit/3b2f5eb0f
[7c27eda66]: https://github.com/ARKEcosystem/core/commit/7c27eda66
[b6a2d854f]: https://github.com/ARKEcosystem/core/commit/b6a2d854f
[43b9c86c7]: https://github.com/ARKEcosystem/core/commit/43b9c86c7
[ff1fcdba6]: https://github.com/ARKEcosystem/core/commit/ff1fcdba6
[c20652ef4]: https://github.com/ARKEcosystem/core/commit/c20652ef4
[17ec422a8]: https://github.com/ARKEcosystem/core/commit/17ec422a8
[aa671a1ae]: https://github.com/ARKEcosystem/core/commit/aa671a1ae
[2c18ee218]: https://github.com/ARKEcosystem/core/commit/2c18ee218
[00f479aad]: https://github.com/ARKEcosystem/core/commit/00f479aad
[fa98820fe]: https://github.com/ARKEcosystem/core/commit/fa98820fe
[dd0500bd4]: https://github.com/ARKEcosystem/core/commit/dd0500bd4
[5d6266669]: https://github.com/ARKEcosystem/core/commit/5d6266669
[f57b56c4a]: https://github.com/ARKEcosystem/core/commit/f57b56c4a
[8b38064b7]: https://github.com/ARKEcosystem/core/commit/8b38064b7
[3fdb47329]: https://github.com/ARKEcosystem/core/commit/3fdb47329
[89213147c]: https://github.com/ARKEcosystem/core/commit/89213147c
[1670b2342]: https://github.com/ARKEcosystem/core/commit/1670b2342
[58ac94cb8]: https://github.com/ARKEcosystem/core/commit/58ac94cb8
[dabea9561]: https://github.com/ARKEcosystem/core/commit/dabea9561
[9361d5cb2]: https://github.com/ARKEcosystem/core/commit/9361d5cb2
[fd1cbec19]: https://github.com/ARKEcosystem/core/commit/fd1cbec19
[cb7548180]: https://github.com/ARKEcosystem/core/commit/cb7548180
[aaf99b46f]: https://github.com/ARKEcosystem/core/commit/aaf99b46f
[919e9205d]: https://github.com/ARKEcosystem/core/commit/919e9205d
[ab7d013b2]: https://github.com/ARKEcosystem/core/commit/ab7d013b2
[8a658f4aa]: https://github.com/ARKEcosystem/core/commit/8a658f4aa
[3cf365397]: https://github.com/ARKEcosystem/core/commit/3cf365397
[25d094377]: https://github.com/ARKEcosystem/core/commit/25d094377
[4570d9fce]: https://github.com/ARKEcosystem/core/commit/4570d9fce
[92792750f]: https://github.com/ARKEcosystem/core/commit/92792750f
[c5808c1f8]: https://github.com/ARKEcosystem/core/commit/c5808c1f8
[e36a18a9d]: https://github.com/ARKEcosystem/core/commit/e36a18a9d
[8ea0ed494]: https://github.com/ARKEcosystem/core/commit/8ea0ed494
[d85d60bc6]: https://github.com/ARKEcosystem/core/commit/d85d60bc6
[d3d77e852]: https://github.com/ARKEcosystem/core/commit/d3d77e852
[409149c65]: https://github.com/ARKEcosystem/core/commit/409149c65
[66e1b571c]: https://github.com/ARKEcosystem/core/commit/66e1b571c
[9e2434a82]: https://github.com/ARKEcosystem/core/commit/9e2434a82
[bebde8efc]: https://github.com/ARKEcosystem/core/commit/bebde8efc
[21b12d476]: https://github.com/ARKEcosystem/core/commit/21b12d476
[bdb6ce765]: https://github.com/ARKEcosystem/core/commit/bdb6ce765
[af4a58f83]: https://github.com/ARKEcosystem/core/commit/af4a58f83
[348f63df3]: https://github.com/ARKEcosystem/core/commit/348f63df3
[39caa0b07]: https://github.com/ARKEcosystem/core/commit/39caa0b07
[6d86afc96]: https://github.com/ARKEcosystem/core/commit/6d86afc96
[df2c5ad4b]: https://github.com/ARKEcosystem/core/commit/df2c5ad4b
[1faef3725]: https://github.com/ARKEcosystem/core/commit/1faef3725
[16e638335]: https://github.com/ARKEcosystem/core/commit/16e638335
[802b248d7]: https://github.com/ARKEcosystem/core/commit/802b248d7
[7bba591e4]: https://github.com/ARKEcosystem/core/commit/7bba591e4
[147c4de4f]: https://github.com/ARKEcosystem/core/commit/147c4de4f
[da715649f]: https://github.com/ARKEcosystem/core/commit/da715649f
[59b94008c]: https://github.com/ARKEcosystem/core/commit/59b94008c
[64659881d]: https://github.com/ARKEcosystem/core/commit/64659881d
[f1eb6077f]: https://github.com/ARKEcosystem/core/commit/f1eb6077f
[f0eebd877]: https://github.com/ARKEcosystem/core/commit/f0eebd877
[210b419c3]: https://github.com/ARKEcosystem/core/commit/210b419c3
[a2bcbace7]: https://github.com/ARKEcosystem/core/commit/a2bcbace7
[e9cee040d]: https://github.com/ARKEcosystem/core/commit/e9cee040d
[2123ed2ff]: https://github.com/ARKEcosystem/core/commit/2123ed2ff
[5c95ce66f]: https://github.com/ARKEcosystem/core/commit/5c95ce66f
[fe8fd07ac]: https://github.com/ARKEcosystem/core/commit/fe8fd07ac
[e16b841be]: https://github.com/ARKEcosystem/core/commit/e16b841be
[bb951a66b]: https://github.com/ARKEcosystem/core/commit/bb951a66b
[ea3d71551]: https://github.com/ARKEcosystem/core/commit/ea3d71551
[0909adc19]: https://github.com/ARKEcosystem/core/commit/0909adc19
[b6db22c88]: https://github.com/ARKEcosystem/core/commit/b6db22c88
[015dde805]: https://github.com/ARKEcosystem/core/commit/015dde805
[ad9418fb1]: https://github.com/ARKEcosystem/core/commit/ad9418fb1
[9c1ad8048]: https://github.com/ARKEcosystem/core/commit/9c1ad8048
[ddd2cbf12]: https://github.com/ARKEcosystem/core/commit/ddd2cbf12
[00545a3ad]: https://github.com/ARKEcosystem/core/commit/00545a3ad
[374c038af]: https://github.com/ARKEcosystem/core/commit/374c038af
[8d2aef9a6]: https://github.com/ARKEcosystem/core/commit/8d2aef9a6
[730347de8]: https://github.com/ARKEcosystem/core/commit/730347de8
[1ceb1c2eb]: https://github.com/ARKEcosystem/core/commit/1ceb1c2eb
[daab2cc08]: https://github.com/ARKEcosystem/core/commit/daab2cc08
[084d2da14]: https://github.com/ARKEcosystem/core/commit/084d2da14
[dd887ec70]: https://github.com/ARKEcosystem/core/commit/dd887ec70
[8948090fd]: https://github.com/ARKEcosystem/core/commit/8948090fd
[cf712bfd6]: https://github.com/ARKEcosystem/core/commit/cf712bfd6
[68272904d]: https://github.com/ARKEcosystem/core/commit/68272904d
[b0c003c08]: https://github.com/ARKEcosystem/core/commit/b0c003c08
[a49fb040e]: https://github.com/ARKEcosystem/core/commit/a49fb040e
[30d0788ac]: https://github.com/ARKEcosystem/core/commit/30d0788ac
[710cb1756]: https://github.com/ARKEcosystem/core/commit/710cb1756
[bc4521963]: https://github.com/ARKEcosystem/core/commit/bc4521963
[ed5ad9120]: https://github.com/ARKEcosystem/core/commit/ed5ad9120
[94531d0a1]: https://github.com/ARKEcosystem/core/commit/94531d0a1
[fff3ecb01]: https://github.com/ARKEcosystem/core/commit/fff3ecb01
[4c79c455a]: https://github.com/ARKEcosystem/core/commit/4c79c455a
[93701759e]: https://github.com/ARKEcosystem/core/commit/93701759e
[f1bf19566]: https://github.com/ARKEcosystem/core/commit/f1bf19566
[021d18aa0]: https://github.com/ARKEcosystem/core/commit/021d18aa0
[e68ed0efc]: https://github.com/ARKEcosystem/core/commit/e68ed0efc
[2392b4f62]: https://github.com/ARKEcosystem/core/commit/2392b4f62
[2a811608d]: https://github.com/ARKEcosystem/core/commit/2a811608d
[633d0a0b2]: https://github.com/ARKEcosystem/core/commit/633d0a0b2
[58a66aa50]: https://github.com/ARKEcosystem/core/commit/58a66aa50
[a5779110a]: https://github.com/ARKEcosystem/core/commit/a5779110a
[ca2dcdc8a]: https://github.com/ARKEcosystem/core/commit/ca2dcdc8a
[4e85a7442]: https://github.com/ARKEcosystem/core/commit/4e85a7442
[79c2b1bf5]: https://github.com/ARKEcosystem/core/commit/79c2b1bf5
[7b19c8de7]: https://github.com/ARKEcosystem/core/commit/7b19c8de7
[bf75b5b29]: https://github.com/ARKEcosystem/core/commit/bf75b5b29
[30ea0c372]: https://github.com/ARKEcosystem/core/commit/30ea0c372
[9747942aa]: https://github.com/ARKEcosystem/core/commit/9747942aa
[82edd4633]: https://github.com/ARKEcosystem/core/commit/82edd4633
[49e89a8f8]: https://github.com/ARKEcosystem/core/commit/49e89a8f8
[ae8dcd734]: https://github.com/ARKEcosystem/core/commit/ae8dcd734
[29eaf1043]: https://github.com/ARKEcosystem/core/commit/29eaf1043
[c6d74215a]: https://github.com/ARKEcosystem/core/commit/c6d74215a
[4565eba2b]: https://github.com/ARKEcosystem/core/commit/4565eba2b
[8f8976deb]: https://github.com/ARKEcosystem/core/commit/8f8976deb
[9eb1ce976]: https://github.com/ARKEcosystem/core/commit/9eb1ce976
[57eaabf07]: https://github.com/ARKEcosystem/core/commit/57eaabf07
[0d97a5125]: https://github.com/ARKEcosystem/core/commit/0d97a5125
[9f0349ba2]: https://github.com/ARKEcosystem/core/commit/9f0349ba2
[3ff160f5a]: https://github.com/ARKEcosystem/core/commit/3ff160f5a
[2b4659d0a]: https://github.com/ARKEcosystem/core/commit/2b4659d0a
[4c8d44e8e]: https://github.com/ARKEcosystem/core/commit/4c8d44e8e
[c480df8c6]: https://github.com/ARKEcosystem/core/commit/c480df8c6
[86cb3cc75]: https://github.com/ARKEcosystem/core/commit/86cb3cc75
[29c7ebb75]: https://github.com/ARKEcosystem/core/commit/29c7ebb75
[96c672d08]: https://github.com/ARKEcosystem/core/commit/96c672d08
[a776999aa]: https://github.com/ARKEcosystem/core/commit/a776999aa
[9f9178d88]: https://github.com/ARKEcosystem/core/commit/9f9178d88
[21eb71a8f]: https://github.com/ARKEcosystem/core/commit/21eb71a8f
[a2389816e]: https://github.com/ARKEcosystem/core/commit/a2389816e
[566d5a25c]: https://github.com/ARKEcosystem/core/commit/566d5a25c
[a476cb095]: https://github.com/ARKEcosystem/core/commit/a476cb095
[7aba83f31]: https://github.com/ARKEcosystem/core/commit/7aba83f31
[1f28875f4]: https://github.com/ARKEcosystem/core/commit/1f28875f4
[aebf70e87]: https://github.com/ARKEcosystem/core/commit/aebf70e87
[ab5b2ad49]: https://github.com/ARKEcosystem/core/commit/ab5b2ad49
[e12f73f2c]: https://github.com/ARKEcosystem/core/commit/e12f73f2c
[40ec05da6]: https://github.com/ARKEcosystem/core/commit/40ec05da6
[26da8d8f6]: https://github.com/ARKEcosystem/core/commit/26da8d8f6
[118c4d48b]: https://github.com/ARKEcosystem/core/commit/118c4d48b
[04b47c10c]: https://github.com/ARKEcosystem/core/commit/04b47c10c
[6c7fea0da]: https://github.com/ARKEcosystem/core/commit/6c7fea0da
[0cbd90eec]: https://github.com/ARKEcosystem/core/commit/0cbd90eec
[307ba66de]: https://github.com/ARKEcosystem/core/commit/307ba66de
[9009863c8]: https://github.com/ARKEcosystem/core/commit/9009863c8
[f12173c83]: https://github.com/ARKEcosystem/core/commit/f12173c83
[7b35d02a5]: https://github.com/ARKEcosystem/core/commit/7b35d02a5
[8e41f0691]: https://github.com/ARKEcosystem/core/commit/8e41f0691
[b56259267]: https://github.com/ARKEcosystem/core/commit/b56259267
[2b3936357]: https://github.com/ARKEcosystem/core/commit/2b3936357
[eecc40cec]: https://github.com/ARKEcosystem/core/commit/eecc40cec
[3f5d49432]: https://github.com/ARKEcosystem/core/commit/3f5d49432
[46d80da5a]: https://github.com/ARKEcosystem/core/commit/46d80da5a
[c291166f8]: https://github.com/ARKEcosystem/core/commit/c291166f8
[43da7d719]: https://github.com/ARKEcosystem/core/commit/43da7d719
[31f9407a0]: https://github.com/ARKEcosystem/core/commit/31f9407a0
[66c19e3f7]: https://github.com/ARKEcosystem/core/commit/66c19e3f7
[0b172029d]: https://github.com/ARKEcosystem/core/commit/0b172029d
[109e26554]: https://github.com/ARKEcosystem/core/commit/109e26554
[2059dba26]: https://github.com/ARKEcosystem/core/commit/2059dba26
[0526ad03a]: https://github.com/ARKEcosystem/core/commit/0526ad03a
[9e3704077]: https://github.com/ARKEcosystem/core/commit/9e3704077
[02c272e6f]: https://github.com/ARKEcosystem/core/commit/02c272e6f
[242f8b479]: https://github.com/ARKEcosystem/core/commit/242f8b479
[4e8f5c1ca]: https://github.com/ARKEcosystem/core/commit/4e8f5c1ca
[feb1d6bc8]: https://github.com/ARKEcosystem/core/commit/feb1d6bc8
[1f7468135]: https://github.com/ARKEcosystem/core/commit/1f7468135
[5c309ea40]: https://github.com/ARKEcosystem/core/commit/5c309ea40
[3c0c4eb3e]: https://github.com/ARKEcosystem/core/commit/3c0c4eb3e
[9c19a7a71]: https://github.com/ARKEcosystem/core/commit/9c19a7a71
[b082935d0]: https://github.com/ARKEcosystem/core/commit/b082935d0
[4a825d16a]: https://github.com/ARKEcosystem/core/commit/4a825d16a
[fbbda7bff]: https://github.com/ARKEcosystem/core/commit/fbbda7bff
[84595c67f]: https://github.com/ARKEcosystem/core/commit/84595c67f
[65b09802f]: https://github.com/ARKEcosystem/core/commit/65b09802f
[12f0a7795]: https://github.com/ARKEcosystem/core/commit/12f0a7795
[5666c122e]: https://github.com/ARKEcosystem/core/commit/5666c122e
[1d03a2c51]: https://github.com/ARKEcosystem/core/commit/1d03a2c51
[d0d98f8fc]: https://github.com/ARKEcosystem/core/commit/d0d98f8fc
[4eb14eecc]: https://github.com/ARKEcosystem/core/commit/4eb14eecc
[ebe038d69]: https://github.com/ARKEcosystem/core/commit/ebe038d69
[aa0643ac7]: https://github.com/ARKEcosystem/core/commit/aa0643ac7
[76aebaed3]: https://github.com/ARKEcosystem/core/commit/76aebaed3
[b54816005]: https://github.com/ARKEcosystem/core/commit/b54816005
[f320c0acd]: https://github.com/ARKEcosystem/core/commit/f320c0acd
[24a488cda]: https://github.com/ARKEcosystem/core/commit/24a488cda
[ba0b44302]: https://github.com/ARKEcosystem/core/commit/ba0b44302
[8006a8da3]: https://github.com/ARKEcosystem/core/commit/8006a8da3
[380fb5b60]: https://github.com/ARKEcosystem/core/commit/380fb5b60
[dd96ee491]: https://github.com/ARKEcosystem/core/commit/dd96ee491
[5e1c5a330]: https://github.com/ARKEcosystem/core/commit/5e1c5a330
[312899c90]: https://github.com/ARKEcosystem/core/commit/312899c90
[850ade02a]: https://github.com/ARKEcosystem/core/commit/850ade02a
[2eadff3ce]: https://github.com/ARKEcosystem/core/commit/2eadff3ce
[3b7a1fe3e]: https://github.com/ARKEcosystem/core/commit/3b7a1fe3e
[617fd7694]: https://github.com/ARKEcosystem/core/commit/617fd7694
[7cf044089]: https://github.com/ARKEcosystem/core/commit/7cf044089
[d44e7e17b]: https://github.com/ARKEcosystem/core/commit/d44e7e17b
[ce3d9302f]: https://github.com/ARKEcosystem/core/commit/ce3d9302f
[361ddabae]: https://github.com/ARKEcosystem/core/commit/361ddabae
[214dec2c4]: https://github.com/ARKEcosystem/core/commit/214dec2c4
[7c071051b]: https://github.com/ARKEcosystem/core/commit/7c071051b
[75e9c2130]: https://github.com/ARKEcosystem/core/commit/75e9c2130
[e8fb5f946]: https://github.com/ARKEcosystem/core/commit/e8fb5f946
[3e76be0c7]: https://github.com/ARKEcosystem/core/commit/3e76be0c7
[2c43f6c60]: https://github.com/ARKEcosystem/core/commit/2c43f6c60
[a13bf618a]: https://github.com/ARKEcosystem/core/commit/a13bf618a
[d80768479]: https://github.com/ARKEcosystem/core/commit/d80768479
[e8000a637]: https://github.com/ARKEcosystem/core/commit/e8000a637
[6e969dd1f]: https://github.com/ARKEcosystem/core/commit/6e969dd1f
[0a69f6597]: https://github.com/ARKEcosystem/core/commit/0a69f6597
[da2e5639d]: https://github.com/ARKEcosystem/core/commit/da2e5639d
[deb2cd78b]: https://github.com/ARKEcosystem/core/commit/deb2cd78b
[6ff407206]: https://github.com/ARKEcosystem/core/commit/6ff407206
[a853d63ff]: https://github.com/ARKEcosystem/core/commit/a853d63ff
[6988cdd4a]: https://github.com/ARKEcosystem/core/commit/6988cdd4a
[ec8cbb94f]: https://github.com/ARKEcosystem/core/commit/ec8cbb94f
[773eb8ce7]: https://github.com/ARKEcosystem/core/commit/773eb8ce7
[700b9cd6f]: https://github.com/ARKEcosystem/core/commit/700b9cd6f
[a917e0853]: https://github.com/ARKEcosystem/core/commit/a917e0853
[bab1d914a]: https://github.com/ARKEcosystem/core/commit/bab1d914a
[2d3fe0914]: https://github.com/ARKEcosystem/core/commit/2d3fe0914
[3ac3eb17e]: https://github.com/ARKEcosystem/core/commit/3ac3eb17e
[620027df0]: https://github.com/ARKEcosystem/core/commit/620027df0
[c968e69d5]: https://github.com/ARKEcosystem/core/commit/c968e69d5
[d0775fdc4]: https://github.com/ARKEcosystem/core/commit/d0775fdc4
[feb1970e6]: https://github.com/ARKEcosystem/core/commit/feb1970e6
[24b164b19]: https://github.com/ARKEcosystem/core/commit/24b164b19
[5da4f4dfa]: https://github.com/ARKEcosystem/core/commit/5da4f4dfa
[ed835c291]: https://github.com/ARKEcosystem/core/commit/ed835c291
[64b63b54c]: https://github.com/ARKEcosystem/core/commit/64b63b54c
[2fb47e6de]: https://github.com/ARKEcosystem/core/commit/2fb47e6de
[777199760]: https://github.com/ARKEcosystem/core/commit/777199760
[649aeaceb]: https://github.com/ARKEcosystem/core/commit/649aeaceb
[437f8cfd5]: https://github.com/ARKEcosystem/core/commit/437f8cfd5
[66f39cb4f]: https://github.com/ARKEcosystem/core/commit/66f39cb4f
[17fcaf375]: https://github.com/ARKEcosystem/core/commit/17fcaf375
[da13465ea]: https://github.com/ARKEcosystem/core/commit/da13465ea
[24a8b044e]: https://github.com/ARKEcosystem/core/commit/24a8b044e
[3b12c7037]: https://github.com/ARKEcosystem/core/commit/3b12c7037
[a27b6c3fa]: https://github.com/ARKEcosystem/core/commit/a27b6c3fa
[bf892b530]: https://github.com/ARKEcosystem/core/commit/bf892b530
[140b860fc]: https://github.com/ARKEcosystem/core/commit/140b860fc
[6bb4feddd]: https://github.com/ARKEcosystem/core/commit/6bb4feddd
[4387b1dfb]: https://github.com/ARKEcosystem/core/commit/4387b1dfb
[ae160d6e7]: https://github.com/ARKEcosystem/core/commit/ae160d6e7
[06261f99c]: https://github.com/ARKEcosystem/core/commit/06261f99c
[51d01a2db]: https://github.com/ARKEcosystem/core/commit/51d01a2db
[440889927]: https://github.com/ARKEcosystem/core/commit/440889927
[48e67e518]: https://github.com/ARKEcosystem/core/commit/48e67e518
[3f8727b2d]: https://github.com/ARKEcosystem/core/commit/3f8727b2d
[af5e54233]: https://github.com/ARKEcosystem/core/commit/af5e54233
[4fc57db60]: https://github.com/ARKEcosystem/core/commit/4fc57db60
[78c49b4ac]: https://github.com/ARKEcosystem/core/commit/78c49b4ac
[9a6358a5f]: https://github.com/ARKEcosystem/core/commit/9a6358a5f
[d6803913c]: https://github.com/ARKEcosystem/core/commit/d6803913c
[3565ef51b]: https://github.com/ARKEcosystem/core/commit/3565ef51b
[f21af3704]: https://github.com/ARKEcosystem/core/commit/f21af3704
[8ebf8218b]: https://github.com/ARKEcosystem/core/commit/8ebf8218b
[39894a40d]: https://github.com/ARKEcosystem/core/commit/39894a40d
[ddd19cc2d]: https://github.com/ARKEcosystem/core/commit/ddd19cc2d
[c2d3f2e5f]: https://github.com/ARKEcosystem/core/commit/c2d3f2e5f
[9f197fa11]: https://github.com/ARKEcosystem/core/commit/9f197fa11
[0ff67a96b]: https://github.com/ARKEcosystem/core/commit/0ff67a96b
[085ab675c]: https://github.com/ARKEcosystem/core/commit/085ab675c
[640b9a1a0]: https://github.com/ARKEcosystem/core/commit/640b9a1a0
[50492b454]: https://github.com/ARKEcosystem/core/commit/50492b454
[08d8c9365]: https://github.com/ARKEcosystem/core/commit/08d8c9365
[fcbe909bb]: https://github.com/ARKEcosystem/core/commit/fcbe909bb
[a7b46a906]: https://github.com/ARKEcosystem/core/commit/a7b46a906
[f2da0bd85]: https://github.com/ARKEcosystem/core/commit/f2da0bd85
[abfe43f8c]: https://github.com/ARKEcosystem/core/commit/abfe43f8c
[f00e075da]: https://github.com/ARKEcosystem/core/commit/f00e075da
[184f5007f]: https://github.com/ARKEcosystem/core/commit/184f5007f
[95d6b2c2c]: https://github.com/ARKEcosystem/core/commit/95d6b2c2c
[dc431faff]: https://github.com/ARKEcosystem/core/commit/dc431faff
[0783ec08d]: https://github.com/ARKEcosystem/core/commit/0783ec08d
[1b0863c38]: https://github.com/ARKEcosystem/core/commit/1b0863c38
[0450ee842]: https://github.com/ARKEcosystem/core/commit/0450ee842
[df7a3aa15]: https://github.com/ARKEcosystem/core/commit/df7a3aa15
[db226bd3a]: https://github.com/ARKEcosystem/core/commit/db226bd3a
[e22328753]: https://github.com/ARKEcosystem/core/commit/e22328753
[50ce984e1]: https://github.com/ARKEcosystem/core/commit/50ce984e1
[cd29f850e]: https://github.com/ARKEcosystem/core/commit/cd29f850e
[1e7d11d46]: https://github.com/ARKEcosystem/core/commit/1e7d11d46
[f18928dd5]: https://github.com/ARKEcosystem/core/commit/f18928dd5
[9796d138a]: https://github.com/ARKEcosystem/core/commit/9796d138a
[47d3cf20d]: https://github.com/ARKEcosystem/core/commit/47d3cf20d
[b42bfb6f7]: https://github.com/ARKEcosystem/core/commit/b42bfb6f7
[5222b5cfb]: https://github.com/ARKEcosystem/core/commit/5222b5cfb
[381e9c7ae]: https://github.com/ARKEcosystem/core/commit/381e9c7ae
[915263a27]: https://github.com/ARKEcosystem/core/commit/915263a27
[110ada8df]: https://github.com/ARKEcosystem/core/commit/110ada8df
[f0fe8b939]: https://github.com/ARKEcosystem/core/commit/f0fe8b939
[9f2eb6296]: https://github.com/ARKEcosystem/core/commit/9f2eb6296
[2400b8df8]: https://github.com/ARKEcosystem/core/commit/2400b8df8
[d9c8b070c]: https://github.com/ARKEcosystem/core/commit/d9c8b070c
[76e9317a3]: https://github.com/ARKEcosystem/core/commit/76e9317a3
[14a3af3af]: https://github.com/ARKEcosystem/core/commit/14a3af3af
[74e1e3790]: https://github.com/ARKEcosystem/core/commit/74e1e3790
[0601aea47]: https://github.com/ARKEcosystem/core/commit/0601aea47
[c03c2dcfe]: https://github.com/ARKEcosystem/core/commit/c03c2dcfe
[7123ff20a]: https://github.com/ARKEcosystem/core/commit/7123ff20a
[90bf42de3]: https://github.com/ARKEcosystem/core/commit/90bf42de3
[4031a51da]: https://github.com/ARKEcosystem/core/commit/4031a51da
[4e7cca1f3]: https://github.com/ARKEcosystem/core/commit/4e7cca1f3
[8a6be81d8]: https://github.com/ARKEcosystem/core/commit/8a6be81d8
[60624a3fd]: https://github.com/ARKEcosystem/core/commit/60624a3fd
[34672893b]: https://github.com/ARKEcosystem/core/commit/34672893b
[cf43417e2]: https://github.com/ARKEcosystem/core/commit/cf43417e2
[c7d8242f3]: https://github.com/ARKEcosystem/core/commit/c7d8242f3
[1a81aee41]: https://github.com/ARKEcosystem/core/commit/1a81aee41
[bd5b1ad03]: https://github.com/ARKEcosystem/core/commit/bd5b1ad03
[89a7176fd]: https://github.com/ARKEcosystem/core/commit/89a7176fd
[fcde95442]: https://github.com/ARKEcosystem/core/commit/fcde95442
[aab40895a]: https://github.com/ARKEcosystem/core/commit/aab40895a
[219a94081]: https://github.com/ARKEcosystem/core/commit/219a94081
[1da58ebb9]: https://github.com/ARKEcosystem/core/commit/1da58ebb9
[ed8a0e803]: https://github.com/ARKEcosystem/core/commit/ed8a0e803
[93937b286]: https://github.com/ARKEcosystem/core/commit/93937b286
[b402dbbfd]: https://github.com/ARKEcosystem/core/commit/b402dbbfd
[36c1ca768]: https://github.com/ARKEcosystem/core/commit/36c1ca768
[35ef5926d]: https://github.com/ARKEcosystem/core/commit/35ef5926d
[0d4b21020]: https://github.com/ARKEcosystem/core/commit/0d4b21020
[bccf74d2c]: https://github.com/ARKEcosystem/core/commit/bccf74d2c
[e943e5635]: https://github.com/ARKEcosystem/core/commit/e943e5635
[7fa7af259]: https://github.com/ARKEcosystem/core/commit/7fa7af259
[7e369b186]: https://github.com/ARKEcosystem/core/commit/7e369b186
[0b5104292]: https://github.com/ARKEcosystem/core/commit/0b5104292
[5700867db]: https://github.com/ARKEcosystem/core/commit/5700867db
[9921a0d1e]: https://github.com/ARKEcosystem/core/commit/9921a0d1e
[b2fee486a]: https://github.com/ARKEcosystem/core/commit/b2fee486a
[4e685146d]: https://github.com/ARKEcosystem/core/commit/4e685146d
[d9fc0c094]: https://github.com/ARKEcosystem/core/commit/d9fc0c094
[daf4bb485]: https://github.com/ARKEcosystem/core/commit/daf4bb485
[70700fa2c]: https://github.com/ARKEcosystem/core/commit/70700fa2c
[f4025bbc5]: https://github.com/ARKEcosystem/core/commit/f4025bbc5
[54ba2d211]: https://github.com/ARKEcosystem/core/commit/54ba2d211
[09e089277]: https://github.com/ARKEcosystem/core/commit/09e089277
[f0acce87a]: https://github.com/ARKEcosystem/core/commit/f0acce87a
[bb8cb1293]: https://github.com/ARKEcosystem/core/commit/bb8cb1293
[b21960971]: https://github.com/ARKEcosystem/core/commit/b21960971
[507f8112f]: https://github.com/ARKEcosystem/core/commit/507f8112f
[3525e8609]: https://github.com/ARKEcosystem/core/commit/3525e8609
[9fc047a1f]: https://github.com/ARKEcosystem/core/commit/9fc047a1f
[b3e0b984a]: https://github.com/ARKEcosystem/core/commit/b3e0b984a
[d65c9de3c]: https://github.com/ARKEcosystem/core/commit/d65c9de3c
[cecf8929e]: https://github.com/ARKEcosystem/core/commit/cecf8929e
[d0650b1a5]: https://github.com/ARKEcosystem/core/commit/d0650b1a5
[8a2033ac9]: https://github.com/ARKEcosystem/core/commit/8a2033ac9
[7cb916abc]: https://github.com/ARKEcosystem/core/commit/7cb916abc
[ce618cc3c]: https://github.com/ARKEcosystem/core/commit/ce618cc3c
[eddb726ff]: https://github.com/ARKEcosystem/core/commit/eddb726ff
[cc7073833]: https://github.com/ARKEcosystem/core/commit/cc7073833
[9ac9b453a]: https://github.com/ARKEcosystem/core/commit/9ac9b453a
[9ea9bb4e6]: https://github.com/ARKEcosystem/core/commit/9ea9bb4e6
[5ef81ef77]: https://github.com/ARKEcosystem/core/commit/5ef81ef77
[ba49d8797]: https://github.com/ARKEcosystem/core/commit/ba49d8797
[3ac7a0345]: https://github.com/ARKEcosystem/core/commit/3ac7a0345
[6f9887f92]: https://github.com/ARKEcosystem/core/commit/6f9887f92
[7ca7d9682]: https://github.com/ARKEcosystem/core/commit/7ca7d9682
[b87a7a8a6]: https://github.com/ARKEcosystem/core/commit/b87a7a8a6
[62f5ae962]: https://github.com/ARKEcosystem/core/commit/62f5ae962
[4757531e0]: https://github.com/ARKEcosystem/core/commit/4757531e0
[1bfc528ab]: https://github.com/ARKEcosystem/core/commit/1bfc528ab
[4190ed639]: https://github.com/ARKEcosystem/core/commit/4190ed639
[1c968188e]: https://github.com/ARKEcosystem/core/commit/1c968188e
[666ba6787]: https://github.com/ARKEcosystem/core/commit/666ba6787
[3439e5283]: https://github.com/ARKEcosystem/core/commit/3439e5283
[29672aa9e]: https://github.com/ARKEcosystem/core/commit/29672aa9e
[a12465527]: https://github.com/ARKEcosystem/core/commit/a12465527
[67ae0c811]: https://github.com/ARKEcosystem/core/commit/67ae0c811
[a29466e89]: https://github.com/ARKEcosystem/core/commit/a29466e89
[d204f752f]: https://github.com/ARKEcosystem/core/commit/d204f752f
[d70c42275]: https://github.com/ARKEcosystem/core/commit/d70c42275
[36b5115b9]: https://github.com/ARKEcosystem/core/commit/36b5115b9
[c74e4ca72]: https://github.com/ARKEcosystem/core/commit/c74e4ca72
[6dacdfbb8]: https://github.com/ARKEcosystem/core/commit/6dacdfbb8
[85287670b]: https://github.com/ARKEcosystem/core/commit/85287670b
[8a383b8dd]: https://github.com/ARKEcosystem/core/commit/8a383b8dd
[8bd811734]: https://github.com/ARKEcosystem/core/commit/8bd811734
[bd0370e3c]: https://github.com/ARKEcosystem/core/commit/bd0370e3c
[97746d0cf]: https://github.com/ARKEcosystem/core/commit/97746d0cf
[cf8a401bc]: https://github.com/ARKEcosystem/core/commit/cf8a401bc
[c52b6ab74]: https://github.com/ARKEcosystem/core/commit/c52b6ab74
[7a8bb932d]: https://github.com/ARKEcosystem/core/commit/7a8bb932d
[052aae85f]: https://github.com/ARKEcosystem/core/commit/052aae85f
[f87e146fb]: https://github.com/ARKEcosystem/core/commit/f87e146fb
[82382fc9c]: https://github.com/ARKEcosystem/core/commit/82382fc9c
[312a1a717]: https://github.com/ARKEcosystem/core/commit/312a1a717
[1cb7e23ed]: https://github.com/ARKEcosystem/core/commit/1cb7e23ed
[fa49ca804]: https://github.com/ARKEcosystem/core/commit/fa49ca804
[10e821751]: https://github.com/ARKEcosystem/core/commit/10e821751
[36a607abc]: https://github.com/ARKEcosystem/core/commit/36a607abc
[ca28f66f2]: https://github.com/ARKEcosystem/core/commit/ca28f66f2
[dcfff76d1]: https://github.com/ARKEcosystem/core/commit/dcfff76d1
[ef450f9d3]: https://github.com/ARKEcosystem/core/commit/ef450f9d3
[118be7ba3]: https://github.com/ARKEcosystem/core/commit/118be7ba3
[f31109fc6]: https://github.com/ARKEcosystem/core/commit/f31109fc6
[7db012655]: https://github.com/ARKEcosystem/core/commit/7db012655
[c8fdde97c]: https://github.com/ARKEcosystem/core/commit/c8fdde97c
[3559f71ed]: https://github.com/ARKEcosystem/core/commit/3559f71ed
[f28ba8db8]: https://github.com/ARKEcosystem/core/commit/f28ba8db8
[67cd2c67f]: https://github.com/ARKEcosystem/core/commit/67cd2c67f
[9c20c02e0]: https://github.com/ARKEcosystem/core/commit/9c20c02e0
[40ddab0d2]: https://github.com/ARKEcosystem/core/commit/40ddab0d2
[247b997d8]: https://github.com/ARKEcosystem/core/commit/247b997d8
[4ef29686b]: https://github.com/ARKEcosystem/core/commit/4ef29686b
[81ebb9496]: https://github.com/ARKEcosystem/core/commit/81ebb9496
[c30425775]: https://github.com/ARKEcosystem/core/commit/c30425775
[9894e9aba]: https://github.com/ARKEcosystem/core/commit/9894e9aba
[fed54c9df]: https://github.com/ARKEcosystem/core/commit/fed54c9df
[56107062d]: https://github.com/ARKEcosystem/core/commit/56107062d
[e1921baa9]: https://github.com/ARKEcosystem/core/commit/e1921baa9
[8df596ab2]: https://github.com/ARKEcosystem/core/commit/8df596ab2
[027c6dec9]: https://github.com/ARKEcosystem/core/commit/027c6dec9
[04436877f]: https://github.com/ARKEcosystem/core/commit/04436877f
[e0b1431ea]: https://github.com/ARKEcosystem/core/commit/e0b1431ea
[b0296e765]: https://github.com/ARKEcosystem/core/commit/b0296e765
[76283d336]: https://github.com/ARKEcosystem/core/commit/76283d336
[084b39624]: https://github.com/ARKEcosystem/core/commit/084b39624
[5911c7cd5]: https://github.com/ARKEcosystem/core/commit/5911c7cd5
[37cb56efc]: https://github.com/ARKEcosystem/core/commit/37cb56efc
[2038cd5ae]: https://github.com/ARKEcosystem/core/commit/2038cd5ae
[4ff97a26f]: https://github.com/ARKEcosystem/core/commit/4ff97a26f
[0d5390fd4]: https://github.com/ARKEcosystem/core/commit/0d5390fd4
[6a5dc31fd]: https://github.com/ARKEcosystem/core/commit/6a5dc31fd
[94c2da2b7]: https://github.com/ARKEcosystem/core/commit/94c2da2b7
[e6d579d69]: https://github.com/ARKEcosystem/core/commit/e6d579d69
[a82a09437]: https://github.com/ARKEcosystem/core/commit/a82a09437
[e97a18aed]: https://github.com/ARKEcosystem/core/commit/e97a18aed
[f779485a7]: https://github.com/ARKEcosystem/core/commit/f779485a7
[606faac84]: https://github.com/ARKEcosystem/core/commit/606faac84
[937ffa087]: https://github.com/ARKEcosystem/core/commit/937ffa087
[4831c7a0f]: https://github.com/ARKEcosystem/core/commit/4831c7a0f
[f1c35f3a9]: https://github.com/ARKEcosystem/core/commit/f1c35f3a9
[82621eeb4]: https://github.com/ARKEcosystem/core/commit/82621eeb4
[21436df52]: https://github.com/ARKEcosystem/core/commit/21436df52
[e428af25d]: https://github.com/ARKEcosystem/core/commit/e428af25d
[be37c11ea]: https://github.com/ARKEcosystem/core/commit/be37c11ea
[5bf4e5901]: https://github.com/ARKEcosystem/core/commit/5bf4e5901
[c2c93f025]: https://github.com/ARKEcosystem/core/commit/c2c93f025
[50fd560b8]: https://github.com/ARKEcosystem/core/commit/50fd560b8
[509db52aa]: https://github.com/ARKEcosystem/core/commit/509db52aa
[64084a0aa]: https://github.com/ARKEcosystem/core/commit/64084a0aa
[af2d8dcf5]: https://github.com/ARKEcosystem/core/commit/af2d8dcf5
[b7e639842]: https://github.com/ARKEcosystem/core/commit/b7e639842
[31eb27a2a]: https://github.com/ARKEcosystem/core/commit/31eb27a2a
[980f3f528]: https://github.com/ARKEcosystem/core/commit/980f3f528
[ba67dbce4]: https://github.com/ARKEcosystem/core/commit/ba67dbce4
[27813b35d]: https://github.com/ARKEcosystem/core/commit/27813b35d
[9a8ecde92]: https://github.com/ARKEcosystem/core/commit/9a8ecde92
[4999fec69]: https://github.com/ARKEcosystem/core/commit/4999fec69
[2aca6e171]: https://github.com/ARKEcosystem/core/commit/2aca6e171
[f7c474109]: https://github.com/ARKEcosystem/core/commit/f7c474109
[37728bdc1]: https://github.com/ARKEcosystem/core/commit/37728bdc1
[c12064dc7]: https://github.com/ARKEcosystem/core/commit/c12064dc7
[fc6720206]: https://github.com/ARKEcosystem/core/commit/fc6720206
[ab27881a4]: https://github.com/ARKEcosystem/core/commit/ab27881a4
[77e036629]: https://github.com/ARKEcosystem/core/commit/77e036629
[2a325d197]: https://github.com/ARKEcosystem/core/commit/2a325d197
[d9b8bc569]: https://github.com/ARKEcosystem/core/commit/d9b8bc569
[68f13e6c6]: https://github.com/ARKEcosystem/core/commit/68f13e6c6
[0d726edfa]: https://github.com/ARKEcosystem/core/commit/0d726edfa
[f6462ef68]: https://github.com/ARKEcosystem/core/commit/f6462ef68
[29019ce03]: https://github.com/ARKEcosystem/core/commit/29019ce03
[fbb82f30e]: https://github.com/ARKEcosystem/core/commit/fbb82f30e
[239f12e14]: https://github.com/ARKEcosystem/core/commit/239f12e14
[ac0c0fef6]: https://github.com/ARKEcosystem/core/commit/ac0c0fef6
[7bbd962dd]: https://github.com/ARKEcosystem/core/commit/7bbd962dd
[8fc18c1af]: https://github.com/ARKEcosystem/core/commit/8fc18c1af
[9f5785e5c]: https://github.com/ARKEcosystem/core/commit/9f5785e5c
[acf34236a]: https://github.com/ARKEcosystem/core/commit/acf34236a
[bf16abde9]: https://github.com/ARKEcosystem/core/commit/bf16abde9
[3ddb098e4]: https://github.com/ARKEcosystem/core/commit/3ddb098e4
[6d4c00a9a]: https://github.com/ARKEcosystem/core/commit/6d4c00a9a
[b87899a57]: https://github.com/ARKEcosystem/core/commit/b87899a57
[454a125a4]: https://github.com/ARKEcosystem/core/commit/454a125a4
[c558ddde3]: https://github.com/ARKEcosystem/core/commit/c558ddde3
[c5284aa4a]: https://github.com/ARKEcosystem/core/commit/c5284aa4a
[b88806f5e]: https://github.com/ARKEcosystem/core/commit/b88806f5e
[1359ba207]: https://github.com/ARKEcosystem/core/commit/1359ba207
[5834847a3]: https://github.com/ARKEcosystem/core/commit/5834847a3
[13d7f83e0]: https://github.com/ARKEcosystem/core/commit/13d7f83e0
[64fe08c2f]: https://github.com/ARKEcosystem/core/commit/64fe08c2f
[3a6b6555e]: https://github.com/ARKEcosystem/core/commit/3a6b6555e
[6dbae81e1]: https://github.com/ARKEcosystem/core/commit/6dbae81e1
[f20abf41c]: https://github.com/ARKEcosystem/core/commit/f20abf41c
[d26701e31]: https://github.com/ARKEcosystem/core/commit/d26701e31
[481d59f9f]: https://github.com/ARKEcosystem/core/commit/481d59f9f
[117bb9e2c]: https://github.com/ARKEcosystem/core/commit/117bb9e2c
[03b51cc6b]: https://github.com/ARKEcosystem/core/commit/03b51cc6b
[2eb295d58]: https://github.com/ARKEcosystem/core/commit/2eb295d58
[d4acdfe26]: https://github.com/ARKEcosystem/core/commit/d4acdfe26
[af4b1b3b0]: https://github.com/ARKEcosystem/core/commit/af4b1b3b0
[511bc8484]: https://github.com/ARKEcosystem/core/commit/511bc8484
[1d3614dee]: https://github.com/ARKEcosystem/core/commit/1d3614dee
[16af15d69]: https://github.com/ARKEcosystem/core/commit/16af15d69
[99eded0c7]: https://github.com/ARKEcosystem/core/commit/99eded0c7
[03a5d7185]: https://github.com/ARKEcosystem/core/commit/03a5d7185
[e8ca52f96]: https://github.com/ARKEcosystem/core/commit/e8ca52f96
[319f778cc]: https://github.com/ARKEcosystem/core/commit/319f778cc
[9768a84e7]: https://github.com/ARKEcosystem/core/commit/9768a84e7
[bb1d2ebf9]: https://github.com/ARKEcosystem/core/commit/bb1d2ebf9
[b99b08271]: https://github.com/ARKEcosystem/core/commit/b99b08271
[4b43552e5]: https://github.com/ARKEcosystem/core/commit/4b43552e5
[a02d3ca38]: https://github.com/ARKEcosystem/core/commit/a02d3ca38
[5b49532b6]: https://github.com/ARKEcosystem/core/commit/5b49532b6
[a324bf344]: https://github.com/ARKEcosystem/core/commit/a324bf344
[99fc27820]: https://github.com/ARKEcosystem/core/commit/99fc27820
[eb021e9ab]: https://github.com/ARKEcosystem/core/commit/eb021e9ab
[01e826483]: https://github.com/ARKEcosystem/core/commit/01e826483
[dcfa1be7d]: https://github.com/ARKEcosystem/core/commit/dcfa1be7d
[dce2a4401]: https://github.com/ARKEcosystem/core/commit/dce2a4401
[ebbe5ae7c]: https://github.com/ARKEcosystem/core/commit/ebbe5ae7c
[4c5e6f1c9]: https://github.com/ARKEcosystem/core/commit/4c5e6f1c9
[fb16e931c]: https://github.com/ARKEcosystem/core/commit/fb16e931c
[8461c9cde]: https://github.com/ARKEcosystem/core/commit/8461c9cde
[cf831409f]: https://github.com/ARKEcosystem/core/commit/cf831409f
[49d3660ea]: https://github.com/ARKEcosystem/core/commit/49d3660ea
[1d10acf54]: https://github.com/ARKEcosystem/core/commit/1d10acf54
[f2a5852ad]: https://github.com/ARKEcosystem/core/commit/f2a5852ad
[0805613cd]: https://github.com/ARKEcosystem/core/commit/0805613cd
[72440be8f]: https://github.com/ARKEcosystem/core/commit/72440be8f
[357106684]: https://github.com/ARKEcosystem/core/commit/357106684
[16446a145]: https://github.com/ARKEcosystem/core/commit/16446a145
[88219cfd8]: https://github.com/ARKEcosystem/core/commit/88219cfd8
[bc71013fc]: https://github.com/ARKEcosystem/core/commit/bc71013fc
[b51793a68]: https://github.com/ARKEcosystem/core/commit/b51793a68
[8465625eb]: https://github.com/ARKEcosystem/core/commit/8465625eb
[5c0c439a7]: https://github.com/ARKEcosystem/core/commit/5c0c439a7
[e9e518ec9]: https://github.com/ARKEcosystem/core/commit/e9e518ec9
[7af9d8fe0]: https://github.com/ARKEcosystem/core/commit/7af9d8fe0
[427b1e728]: https://github.com/ARKEcosystem/core/commit/427b1e728
[7dc219a62]: https://github.com/ARKEcosystem/core/commit/7dc219a62
[12e8eb5d5]: https://github.com/ARKEcosystem/core/commit/12e8eb5d5
[8494784b3]: https://github.com/ARKEcosystem/core/commit/8494784b3
[c11af3a12]: https://github.com/ARKEcosystem/core/commit/c11af3a12
[ff8975a04]: https://github.com/ARKEcosystem/core/commit/ff8975a04
[8ee148a74]: https://github.com/ARKEcosystem/core/commit/8ee148a74
[b15387132]: https://github.com/ARKEcosystem/core/commit/b15387132
[bde4e4cd0]: https://github.com/ARKEcosystem/core/commit/bde4e4cd0
[e69e33c0e]: https://github.com/ARKEcosystem/core/commit/e69e33c0e
[94766eaeb]: https://github.com/ARKEcosystem/core/commit/94766eaeb
[6ab6d6938]: https://github.com/ARKEcosystem/core/commit/6ab6d6938
[5d21a3447]: https://github.com/ARKEcosystem/core/commit/5d21a3447
[c84b97666]: https://github.com/ARKEcosystem/core/commit/c84b97666
[905cac2fe]: https://github.com/ARKEcosystem/core/commit/905cac2fe
[cad345708]: https://github.com/ARKEcosystem/core/commit/cad345708
[82623ff7d]: https://github.com/ARKEcosystem/core/commit/82623ff7d
[8482282a4]: https://github.com/ARKEcosystem/core/commit/8482282a4
[dc68c251a]: https://github.com/ARKEcosystem/core/commit/dc68c251a
[33256dbe9]: https://github.com/ARKEcosystem/core/commit/33256dbe9
[ee1a13138]: https://github.com/ARKEcosystem/core/commit/ee1a13138
[c84943a94]: https://github.com/ARKEcosystem/core/commit/c84943a94
[7f07ff0b5]: https://github.com/ARKEcosystem/core/commit/7f07ff0b5
[84aee929d]: https://github.com/ARKEcosystem/core/commit/84aee929d
[daadf358a]: https://github.com/ARKEcosystem/core/commit/daadf358a
[460c6faac]: https://github.com/ARKEcosystem/core/commit/460c6faac
[84c478849]: https://github.com/ARKEcosystem/core/commit/84c478849
[5191f6996]: https://github.com/ARKEcosystem/core/commit/5191f6996
[5a82211f0]: https://github.com/ARKEcosystem/core/commit/5a82211f0
[838ca5de4]: https://github.com/ARKEcosystem/core/commit/838ca5de4
[cded589bd]: https://github.com/ARKEcosystem/core/commit/cded589bd
[c76062089]: https://github.com/ARKEcosystem/core/commit/c76062089
[dd83c08b2]: https://github.com/ARKEcosystem/core/commit/dd83c08b2
[4f3e8dcee]: https://github.com/ARKEcosystem/core/commit/4f3e8dcee
[6529b1338]: https://github.com/ARKEcosystem/core/commit/6529b1338
[3eab947dd]: https://github.com/ARKEcosystem/core/commit/3eab947dd
[a636dfd38]: https://github.com/ARKEcosystem/core/commit/a636dfd38
[243f0bca2]: https://github.com/ARKEcosystem/core/commit/243f0bca2
[1e489b063]: https://github.com/ARKEcosystem/core/commit/1e489b063
[f67c9137d]: https://github.com/ARKEcosystem/core/commit/f67c9137d
[a7f3d03e8]: https://github.com/ARKEcosystem/core/commit/a7f3d03e8
[f93a9118d]: https://github.com/ARKEcosystem/core/commit/f93a9118d
[92c31bee8]: https://github.com/ARKEcosystem/core/commit/92c31bee8
[c4a8b70d2]: https://github.com/ARKEcosystem/core/commit/c4a8b70d2
[b3aab122e]: https://github.com/ARKEcosystem/core/commit/b3aab122e
[a116e3f06]: https://github.com/ARKEcosystem/core/commit/a116e3f06
[647b77fe0]: https://github.com/ARKEcosystem/core/commit/647b77fe0
[ab78411e9]: https://github.com/ARKEcosystem/core/commit/ab78411e9
[5a5b3d7fa]: https://github.com/ARKEcosystem/core/commit/5a5b3d7fa
[de75e6ea9]: https://github.com/ARKEcosystem/core/commit/de75e6ea9
[e323bb500]: https://github.com/ARKEcosystem/core/commit/e323bb500
[5c3afa4ad]: https://github.com/ARKEcosystem/core/commit/5c3afa4ad
[a9241c6ce]: https://github.com/ARKEcosystem/core/commit/a9241c6ce
[148e98f19]: https://github.com/ARKEcosystem/core/commit/148e98f19
[8bea92418]: https://github.com/ARKEcosystem/core/commit/8bea92418
[2ab33be68]: https://github.com/ARKEcosystem/core/commit/2ab33be68
[1d9dd821d]: https://github.com/ARKEcosystem/core/commit/1d9dd821d
[8d8bb74f4]: https://github.com/ARKEcosystem/core/commit/8d8bb74f4
[43ce7dd42]: https://github.com/ARKEcosystem/core/commit/43ce7dd42
[80d6712b4]: https://github.com/ARKEcosystem/core/commit/80d6712b4
[02a575ca8]: https://github.com/ARKEcosystem/core/commit/02a575ca8
[c199cd803]: https://github.com/ARKEcosystem/core/commit/c199cd803
[d7e895c03]: https://github.com/ARKEcosystem/core/commit/d7e895c03
[6f7b54cf8]: https://github.com/ARKEcosystem/core/commit/6f7b54cf8
[c88c33251]: https://github.com/ARKEcosystem/core/commit/c88c33251
[b96bb4975]: https://github.com/ARKEcosystem/core/commit/b96bb4975
[f961d053a]: https://github.com/ARKEcosystem/core/commit/f961d053a
[4a9afb4a8]: https://github.com/ARKEcosystem/core/commit/4a9afb4a8
[27abce8e6]: https://github.com/ARKEcosystem/core/commit/27abce8e6
[67d9cef15]: https://github.com/ARKEcosystem/core/commit/67d9cef15
[99927e77c]: https://github.com/ARKEcosystem/core/commit/99927e77c
[044ca8303]: https://github.com/ARKEcosystem/core/commit/044ca8303
[c520d8195]: https://github.com/ARKEcosystem/core/commit/c520d8195
[09619ad7f]: https://github.com/ARKEcosystem/core/commit/09619ad7f
[0e1308279]: https://github.com/ARKEcosystem/core/commit/0e1308279
[d7394e946]: https://github.com/ARKEcosystem/core/commit/d7394e946
[3416b86a6]: https://github.com/ARKEcosystem/core/commit/3416b86a6
[5aea54f32]: https://github.com/ARKEcosystem/core/commit/5aea54f32
[f3dcb1f36]: https://github.com/ARKEcosystem/core/commit/f3dcb1f36
[12869b386]: https://github.com/ARKEcosystem/core/commit/12869b386
[dfc95a668]: https://github.com/ARKEcosystem/core/commit/dfc95a668
[cb50a6221]: https://github.com/ARKEcosystem/core/commit/cb50a6221
[3f62bb54c]: https://github.com/ARKEcosystem/core/commit/3f62bb54c
[9c9e7b336]: https://github.com/ARKEcosystem/core/commit/9c9e7b336
[be2522600]: https://github.com/ARKEcosystem/core/commit/be2522600
[292d9e84d]: https://github.com/ARKEcosystem/core/commit/292d9e84d
[1a4e13201]: https://github.com/ARKEcosystem/core/commit/1a4e13201
[8f028f8ca]: https://github.com/ARKEcosystem/core/commit/8f028f8ca
[56f482d5b]: https://github.com/ARKEcosystem/core/commit/56f482d5b
[0663b0ff8]: https://github.com/ARKEcosystem/core/commit/0663b0ff8
[acc5e16c1]: https://github.com/ARKEcosystem/core/commit/acc5e16c1
[4fc0559ee]: https://github.com/ARKEcosystem/core/commit/4fc0559ee
[6fe1e1e10]: https://github.com/ARKEcosystem/core/commit/6fe1e1e10
[3131db9b2]: https://github.com/ARKEcosystem/core/commit/3131db9b2
[83c56f15e]: https://github.com/ARKEcosystem/core/commit/83c56f15e
[cba7f3bf1]: https://github.com/ARKEcosystem/core/commit/cba7f3bf1
[89fc75762]: https://github.com/ARKEcosystem/core/commit/89fc75762
[8ca900069]: https://github.com/ARKEcosystem/core/commit/8ca900069
[dbf7a07a8]: https://github.com/ARKEcosystem/core/commit/dbf7a07a8
[1619caa47]: https://github.com/ARKEcosystem/core/commit/1619caa47
[bc53bce33]: https://github.com/ARKEcosystem/core/commit/bc53bce33
[00f4964be]: https://github.com/ARKEcosystem/core/commit/00f4964be
[27668ace7]: https://github.com/ARKEcosystem/core/commit/27668ace7
[7d449acb7]: https://github.com/ARKEcosystem/core/commit/7d449acb7
[ee802a06d]: https://github.com/ARKEcosystem/core/commit/ee802a06d
[9800e34be]: https://github.com/ARKEcosystem/core/commit/9800e34be
[a801c5190]: https://github.com/ARKEcosystem/core/commit/a801c5190
[0257c3c44]: https://github.com/ARKEcosystem/core/commit/0257c3c44
[58fb16093]: https://github.com/ARKEcosystem/core/commit/58fb16093
[c6b31eb86]: https://github.com/ARKEcosystem/core/commit/c6b31eb86
[65d98fb8a]: https://github.com/ARKEcosystem/core/commit/65d98fb8a
[98522ea19]: https://github.com/ARKEcosystem/core/commit/98522ea19
[2a8fa004c]: https://github.com/ARKEcosystem/core/commit/2a8fa004c
[7acf6cc3f]: https://github.com/ARKEcosystem/core/commit/7acf6cc3f
[c1eafab5b]: https://github.com/ARKEcosystem/core/commit/c1eafab5b
[91e815eb0]: https://github.com/ARKEcosystem/core/commit/91e815eb0
[afd151251]: https://github.com/ARKEcosystem/core/commit/afd151251
[5dbc8a8fc]: https://github.com/ARKEcosystem/core/commit/5dbc8a8fc
[0a4a659b9]: https://github.com/ARKEcosystem/core/commit/0a4a659b9
[ad8595112]: https://github.com/ARKEcosystem/core/commit/ad8595112
[2e7769a9d]: https://github.com/ARKEcosystem/core/commit/2e7769a9d
[159098b08]: https://github.com/ARKEcosystem/core/commit/159098b08
[e462e76d8]: https://github.com/ARKEcosystem/core/commit/e462e76d8
[b31d7582a]: https://github.com/ARKEcosystem/core/commit/b31d7582a
[3863d6eb3]: https://github.com/ARKEcosystem/core/commit/3863d6eb3
[cb2c9a399]: https://github.com/ARKEcosystem/core/commit/cb2c9a399
[cecf2f97b]: https://github.com/ARKEcosystem/core/commit/cecf2f97b
[bb91fab5f]: https://github.com/ARKEcosystem/core/commit/bb91fab5f
[ef796f975]: https://github.com/ARKEcosystem/core/commit/ef796f975
[2854dc9f1]: https://github.com/ARKEcosystem/core/commit/2854dc9f1
[a8f88db7d]: https://github.com/ARKEcosystem/core/commit/a8f88db7d
[f361a796c]: https://github.com/ARKEcosystem/core/commit/f361a796c
[1b3c5b6f6]: https://github.com/ARKEcosystem/core/commit/1b3c5b6f6
[f284b4bea]: https://github.com/ARKEcosystem/core/commit/f284b4bea
[12ec1a22e]: https://github.com/ARKEcosystem/core/commit/12ec1a22e
[63de81ed2]: https://github.com/ARKEcosystem/core/commit/63de81ed2
[7d8d8f98d]: https://github.com/ARKEcosystem/core/commit/7d8d8f98d
[dee3a5c17]: https://github.com/ARKEcosystem/core/commit/dee3a5c17
[4574e6e68]: https://github.com/ARKEcosystem/core/commit/4574e6e68
[f8dfefa44]: https://github.com/ARKEcosystem/core/commit/f8dfefa44
[65200125e]: https://github.com/ARKEcosystem/core/commit/65200125e
[7d216b37c]: https://github.com/ARKEcosystem/core/commit/7d216b37c
[14b64899b]: https://github.com/ARKEcosystem/core/commit/14b64899b
[9f410eaea]: https://github.com/ARKEcosystem/core/commit/9f410eaea
[05dd51fdf]: https://github.com/ARKEcosystem/core/commit/05dd51fdf
[6b3e0cba7]: https://github.com/ARKEcosystem/core/commit/6b3e0cba7
[8b64f7f50]: https://github.com/ARKEcosystem/core/commit/8b64f7f50
[4bbfaa22a]: https://github.com/ARKEcosystem/core/commit/4bbfaa22a
[3877e56cc]: https://github.com/ARKEcosystem/core/commit/3877e56cc
[4787d4461]: https://github.com/ARKEcosystem/core/commit/4787d4461
[e67abe70d]: https://github.com/ARKEcosystem/core/commit/e67abe70d
[95df80297]: https://github.com/ARKEcosystem/core/commit/95df80297
[deef78d89]: https://github.com/ARKEcosystem/core/commit/deef78d89
[2c619ae18]: https://github.com/ARKEcosystem/core/commit/2c619ae18
[0ef251281]: https://github.com/ARKEcosystem/core/commit/0ef251281
[f2ced87fc]: https://github.com/ARKEcosystem/core/commit/f2ced87fc
[697d34779]: https://github.com/ARKEcosystem/core/commit/697d34779
[d579fdaf7]: https://github.com/ARKEcosystem/core/commit/d579fdaf7
[61c4d5f22]: https://github.com/ARKEcosystem/core/commit/61c4d5f22
[0081a2fd2]: https://github.com/ARKEcosystem/core/commit/0081a2fd2
[98def5ab5]: https://github.com/ARKEcosystem/core/commit/98def5ab5
[5ef8fc8a8]: https://github.com/ARKEcosystem/core/commit/5ef8fc8a8
[7d1809290]: https://github.com/ARKEcosystem/core/commit/7d1809290
[d00a6a976]: https://github.com/ARKEcosystem/core/commit/d00a6a976
[196be48ff]: https://github.com/ARKEcosystem/core/commit/196be48ff
[eb52b9494]: https://github.com/ARKEcosystem/core/commit/eb52b9494
[c5d360fd1]: https://github.com/ARKEcosystem/core/commit/c5d360fd1
[bf64a68a0]: https://github.com/ARKEcosystem/core/commit/bf64a68a0
[47275d674]: https://github.com/ARKEcosystem/core/commit/47275d674
[cbd4abc21]: https://github.com/ARKEcosystem/core/commit/cbd4abc21
[958e6257a]: https://github.com/ARKEcosystem/core/commit/958e6257a
[651cf1607]: https://github.com/ARKEcosystem/core/commit/651cf1607
[d20f15b2a]: https://github.com/ARKEcosystem/core/commit/d20f15b2a
[03fdf0196]: https://github.com/ARKEcosystem/core/commit/03fdf0196
[13808e09f]: https://github.com/ARKEcosystem/core/commit/13808e09f
[5c404b69b]: https://github.com/ARKEcosystem/core/commit/5c404b69b
[95a787c20]: https://github.com/ARKEcosystem/core/commit/95a787c20
[6c41a0832]: https://github.com/ARKEcosystem/core/commit/6c41a0832
[213b71a12]: https://github.com/ARKEcosystem/core/commit/213b71a12
[d1cda3c9c]: https://github.com/ARKEcosystem/core/commit/d1cda3c9c
[c53f6f52e]: https://github.com/ARKEcosystem/core/commit/c53f6f52e
[c78e56116]: https://github.com/ARKEcosystem/core/commit/c78e56116
[6a1f8d2b8]: https://github.com/ARKEcosystem/core/commit/6a1f8d2b8
[3bcc8fae3]: https://github.com/ARKEcosystem/core/commit/3bcc8fae3
[98c88c400]: https://github.com/ARKEcosystem/core/commit/98c88c400
[1ddcba42d]: https://github.com/ARKEcosystem/core/commit/1ddcba42d
[8dbe404b8]: https://github.com/ARKEcosystem/core/commit/8dbe404b8
[15643452a]: https://github.com/ARKEcosystem/core/commit/15643452a
[0dc63ae08]: https://github.com/ARKEcosystem/core/commit/0dc63ae08
[7d09120c7]: https://github.com/ARKEcosystem/core/commit/7d09120c7
[a3e9749bb]: https://github.com/ARKEcosystem/core/commit/a3e9749bb
[2ca694f9c]: https://github.com/ARKEcosystem/core/commit/2ca694f9c
[1b28c6d4d]: https://github.com/ARKEcosystem/core/commit/1b28c6d4d
[12d5f031b]: https://github.com/ARKEcosystem/core/commit/12d5f031b
[925f052ce]: https://github.com/ARKEcosystem/core/commit/925f052ce
[8056ef856]: https://github.com/ARKEcosystem/core/commit/8056ef856
[db0ce174d]: https://github.com/ARKEcosystem/core/commit/db0ce174d
[b13d52d32]: https://github.com/ARKEcosystem/core/commit/b13d52d32
[bfa2c2827]: https://github.com/ARKEcosystem/core/commit/bfa2c2827
[b0c57992b]: https://github.com/ARKEcosystem/core/commit/b0c57992b
[63dc25257]: https://github.com/ARKEcosystem/core/commit/63dc25257
[892a6105f]: https://github.com/ARKEcosystem/core/commit/892a6105f
[9a6de2dd9]: https://github.com/ARKEcosystem/core/commit/9a6de2dd9
[8f7d0d319]: https://github.com/ARKEcosystem/core/commit/8f7d0d319
[92e01152d]: https://github.com/ARKEcosystem/core/commit/92e01152d
[fddd50014]: https://github.com/ARKEcosystem/core/commit/fddd50014
[2aad9efd4]: https://github.com/ARKEcosystem/core/commit/2aad9efd4
[2d5ea1aa8]: https://github.com/ARKEcosystem/core/commit/2d5ea1aa8
[5fa1df36d]: https://github.com/ARKEcosystem/core/commit/5fa1df36d
[3753b290c]: https://github.com/ARKEcosystem/core/commit/3753b290c
[516a58619]: https://github.com/ARKEcosystem/core/commit/516a58619
[a60734a87]: https://github.com/ARKEcosystem/core/commit/a60734a87
[334d59af6]: https://github.com/ARKEcosystem/core/commit/334d59af6
[2a81383f4]: https://github.com/ARKEcosystem/core/commit/2a81383f4
[daa830f82]: https://github.com/ARKEcosystem/core/commit/daa830f82
[279585be6]: https://github.com/ARKEcosystem/core/commit/279585be6
[7aaa14343]: https://github.com/ARKEcosystem/core/commit/7aaa14343
[6645c1314]: https://github.com/ARKEcosystem/core/commit/6645c1314
[6c6c96c92]: https://github.com/ARKEcosystem/core/commit/6c6c96c92
[6bccf660d]: https://github.com/ARKEcosystem/core/commit/6bccf660d
[77cc8d7c7]: https://github.com/ARKEcosystem/core/commit/77cc8d7c7
[84aedb1b4]: https://github.com/ARKEcosystem/core/commit/84aedb1b4
[c218d1a8f]: https://github.com/ARKEcosystem/core/commit/c218d1a8f
[5fc1e4043]: https://github.com/ARKEcosystem/core/commit/5fc1e4043
[d7dbbec84]: https://github.com/ARKEcosystem/core/commit/d7dbbec84
[eeb996c64]: https://github.com/ARKEcosystem/core/commit/eeb996c64
[b37233e30]: https://github.com/ARKEcosystem/core/commit/b37233e30
[ad5e82306]: https://github.com/ARKEcosystem/core/commit/ad5e82306
[2eac04200]: https://github.com/ARKEcosystem/core/commit/2eac04200
[8ad272ba3]: https://github.com/ARKEcosystem/core/commit/8ad272ba3
[ec2002d48]: https://github.com/ARKEcosystem/core/commit/ec2002d48
[0dce18971]: https://github.com/ARKEcosystem/core/commit/0dce18971
[f73bd8bbb]: https://github.com/ARKEcosystem/core/commit/f73bd8bbb
[3a34308e3]: https://github.com/ARKEcosystem/core/commit/3a34308e3
[298117628]: https://github.com/ARKEcosystem/core/commit/298117628
[5f7ca208c]: https://github.com/ARKEcosystem/core/commit/5f7ca208c
[8697d1dae]: https://github.com/ARKEcosystem/core/commit/8697d1dae
[8059fb51c]: https://github.com/ARKEcosystem/core/commit/8059fb51c
[37e8f52ae]: https://github.com/ARKEcosystem/core/commit/37e8f52ae
[41a869a44]: https://github.com/ARKEcosystem/core/commit/41a869a44
[5d7d3d6cc]: https://github.com/ARKEcosystem/core/commit/5d7d3d6cc
[3c12f5a18]: https://github.com/ARKEcosystem/core/commit/3c12f5a18
[08ca0fac5]: https://github.com/ARKEcosystem/core/commit/08ca0fac5
[b2271ceb8]: https://github.com/ARKEcosystem/core/commit/b2271ceb8
[d98ada544]: https://github.com/ARKEcosystem/core/commit/d98ada544
[7116976d3]: https://github.com/ARKEcosystem/core/commit/7116976d3
[bb528bf6e]: https://github.com/ARKEcosystem/core/commit/bb528bf6e
[c97357c76]: https://github.com/ARKEcosystem/core/commit/c97357c76
[789fdb70e]: https://github.com/ARKEcosystem/core/commit/789fdb70e
[dd4c9aba0]: https://github.com/ARKEcosystem/core/commit/dd4c9aba0
[76f06acaa]: https://github.com/ARKEcosystem/core/commit/76f06acaa
[5ac0c41b0]: https://github.com/ARKEcosystem/core/commit/5ac0c41b0
[56ff979db]: https://github.com/ARKEcosystem/core/commit/56ff979db
[8e8034044]: https://github.com/ARKEcosystem/core/commit/8e8034044
[f5c185fe2]: https://github.com/ARKEcosystem/core/commit/f5c185fe2
[6a1f5c1d9]: https://github.com/ARKEcosystem/core/commit/6a1f5c1d9
[d5821761c]: https://github.com/ARKEcosystem/core/commit/d5821761c
[eceab20f0]: https://github.com/ARKEcosystem/core/commit/eceab20f0
[56850c56e]: https://github.com/ARKEcosystem/core/commit/56850c56e
[67b10ddcd]: https://github.com/ARKEcosystem/core/commit/67b10ddcd
[0c03165da]: https://github.com/ARKEcosystem/core/commit/0c03165da
[c61372885]: https://github.com/ARKEcosystem/core/commit/c61372885
[ab8cc65a5]: https://github.com/ARKEcosystem/core/commit/ab8cc65a5
[33d8ba754]: https://github.com/ARKEcosystem/core/commit/33d8ba754
[dc4bc4edf]: https://github.com/ARKEcosystem/core/commit/dc4bc4edf
[8c773dab4]: https://github.com/ARKEcosystem/core/commit/8c773dab4
[8836016ea]: https://github.com/ARKEcosystem/core/commit/8836016ea
[0367e8e14]: https://github.com/ARKEcosystem/core/commit/0367e8e14
[75199f713]: https://github.com/ARKEcosystem/core/commit/75199f713
[e6c9e9b6a]: https://github.com/ARKEcosystem/core/commit/e6c9e9b6a
[5e5eb2a46]: https://github.com/ARKEcosystem/core/commit/5e5eb2a46
[5f4c6e8c4]: https://github.com/ARKEcosystem/core/commit/5f4c6e8c4
[d6a42f2e5]: https://github.com/ARKEcosystem/core/commit/d6a42f2e5
[050ce16b1]: https://github.com/ARKEcosystem/core/commit/050ce16b1
[cfd39d085]: https://github.com/ARKEcosystem/core/commit/cfd39d085
[58478848a]: https://github.com/ARKEcosystem/core/commit/58478848a
[344de61ac]: https://github.com/ARKEcosystem/core/commit/344de61ac
[01e47446b]: https://github.com/ARKEcosystem/core/commit/01e47446b
[583f5a928]: https://github.com/ARKEcosystem/core/commit/583f5a928
[1a823ee70]: https://github.com/ARKEcosystem/core/commit/1a823ee70
[f407903b6]: https://github.com/ARKEcosystem/core/commit/f407903b6
[75c117741]: https://github.com/ARKEcosystem/core/commit/75c117741
[1016bd5fa]: https://github.com/ARKEcosystem/core/commit/1016bd5fa
[aec0f5ad3]: https://github.com/ARKEcosystem/core/commit/aec0f5ad3
[d449340c7]: https://github.com/ARKEcosystem/core/commit/d449340c7
[a201d64ff]: https://github.com/ARKEcosystem/core/commit/a201d64ff
[bf4222444]: https://github.com/ARKEcosystem/core/commit/bf4222444
[9d12bb1fc]: https://github.com/ARKEcosystem/core/commit/9d12bb1fc
[ade3a5d49]: https://github.com/ARKEcosystem/core/commit/ade3a5d49
[d44e29ccc]: https://github.com/ARKEcosystem/core/commit/d44e29ccc
[1de4f3fce]: https://github.com/ARKEcosystem/core/commit/1de4f3fce
[29e8485f8]: https://github.com/ARKEcosystem/core/commit/29e8485f8
[42b0805c0]: https://github.com/ARKEcosystem/core/commit/42b0805c0
[fc157999e]: https://github.com/ARKEcosystem/core/commit/fc157999e
[7c402ac2b]: https://github.com/ARKEcosystem/core/commit/7c402ac2b
[daf1d922a]: https://github.com/ARKEcosystem/core/commit/daf1d922a
[77893fda5]: https://github.com/ARKEcosystem/core/commit/77893fda5
[9b368c957]: https://github.com/ARKEcosystem/core/commit/9b368c957
[0f7e589b4]: https://github.com/ARKEcosystem/core/commit/0f7e589b4
[85b6b605e]: https://github.com/ARKEcosystem/core/commit/85b6b605e
[53e4469f3]: https://github.com/ARKEcosystem/core/commit/53e4469f3
[e8a2d6bea]: https://github.com/ARKEcosystem/core/commit/e8a2d6bea
[0c55ea134]: https://github.com/ARKEcosystem/core/commit/0c55ea134
[c70bf0bb7]: https://github.com/ARKEcosystem/core/commit/c70bf0bb7
[d0c299ebb]: https://github.com/ARKEcosystem/core/commit/d0c299ebb
[3c413d434]: https://github.com/ARKEcosystem/core/commit/3c413d434
[5d96cbfc4]: https://github.com/ARKEcosystem/core/commit/5d96cbfc4
[a399f1948]: https://github.com/ARKEcosystem/core/commit/a399f1948
[f47b55c84]: https://github.com/ARKEcosystem/core/commit/f47b55c84
[f3ed2f980]: https://github.com/ARKEcosystem/core/commit/f3ed2f980
[64cb9e929]: https://github.com/ARKEcosystem/core/commit/64cb9e929
[659b881b1]: https://github.com/ARKEcosystem/core/commit/659b881b1
