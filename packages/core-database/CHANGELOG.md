# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Database rollback
- Block exceptions
- Common blocks
- More graceful handling of shutdown

### Changed
- Build delegate list in-memory to reduce database load
- Perform vote balance calculations in-memory to reduce database load
- Handle numbers as `BigNumber` instances
- Reduced complexity and duplicated logic
- Improved method names to more clearly show their intent
- Calculate previous rounds in-memory rather then hitting the database
- non-blocking wallet saving
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Fixed
- Wrong documentation
- Bad method calls for `sync/async` methods
- Only commit data when `saveBlockCommit` is called
- Properly log the transaction audit
- Properly update delegate ranks
- Only save dirty wallets
- Various memory leaks
- Forger order on mainnet
- Delegate registration handling

## 0.1.1 - 2018-06-14

### Added
- initial release
