# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

-   Migrated from JavaScript to TypeScript
-   Moved the `peers.json` configuration into `core-p2p`
-   Merged `core-transaction-pool-mem` into `core-transaction-pool`

### Fixed

-   Resolved an issue with the `resolveOptions` method that would result in options being resolved for plugins that are not registered in the container.

## [2.0.15] - 2018-12-11

### Fixed

-   Ensure no local peers are enlisted
-   Ensure the IP of the TCP connection is used

## [2.0.14] - 2018-12-10

### Fixed

-   Reset last downloaded block when block is discarded

## [2.0.13] - 2018-12-07

### Fixed

-   Ensure safe integer range for block height lookups via API

## [2.0.12] - 2018-12-06

### Fixed

-   Perform second-signature checks in the `canApply` logic of multi-signatures

## [2.0.11] - 2018-12-05

### Added

-   Store executed migrations in the database

### Changed

-   Increase cache generation timeout and make it configurable

## [2.0.1] - 2018-12-05

### Changed

-   Improved performance for block and transaction queries by adding more indices on critical columns

### Fixed

-   Take milestones into account for supply calculations

## [2.0.0] - 2018-12-03

### Changed

-   Initial Release
-   Publish first major release of `core`
-   Publish first major release of `core-api`
-   Publish first major release of `core-blockchain`
-   Publish first major release of `core-config`
-   Publish first major release of `core-container`
-   Publish first major release of `core-database`
-   Publish first major release of `core-database-postgres`
-   Publish first major release of `core-debugger-cli`
-   Publish first major release of `core-deployer`
-   Publish first major release of `core-elasticsearch`
-   Publish first major release of `core-error-tracker-bugsnag`
-   Publish first major release of `core-error-tracker-sentry`
-   Publish first major release of `core-event-emitter`
-   Publish first major release of `core-forger`
-   Publish first major release of `core-graphql`
-   Publish first major release of `core-http-utils`
-   Publish first major release of `core-json-rpc`
-   Publish first major release of `core-logger`
-   Publish first major release of `core-logger-winston`
-   Publish first major release of `core-p2p`
-   Publish first major release of `core-snapshots`
-   Publish first major release of `core-snapshots-cli`
-   Publish first major release of `core-test-utils`
-   Publish first major release of `core-tester-cli`
-   Publish first major release of `core-transaction-pool`
-   Publish first major release of `core-utils`
-   Publish first major release of `core-vote-report`
-   Publish first major release of `core-webhooks`
-   Publish first major release of `crypto`

[unreleased]: https://github.com/ArkEcosystem/core/compare/2.0.15...develop
[2.0.15]: https://github.com/ArkEcosystem/core/compare/2.0.14...2.0.15
[2.0.14]: https://github.com/ArkEcosystem/core/compare/2.0.13...2.0.14
[2.0.13]: https://github.com/ArkEcosystem/core/compare/2.0.12...2.0.13
[2.0.12]: https://github.com/ArkEcosystem/core/compare/2.0.11...2.0.12
[2.0.11]: https://github.com/ArkEcosystem/core/compare/2.0.1...2.0.11
[2.0.1]: https://github.com/ArkEcosystem/core/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/ArkEcosystem/core/compare/0.1.1...2.0.0
