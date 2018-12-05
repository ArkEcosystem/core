# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.11 - 2018-12-05

### Added

- Store executed migrations in the database

## 0.2.1 - 2018-12-05

### Added

- `sender_public_key`, `recipient_id` and `timestamp` indices on the `transactions` table
- `generator_public_key` index on the `blocks` table

## 0.2.0 - 2018-12-03

### Added

- Database rollback

### Changed

- Build delegate list in-memory to reduce database load
- Perform vote balance calculations in-memory to reduce database load
- Handle numbers as `BigNumber` instances
- Reduced complexity and duplicated logic
- Improved performance of various SQL queries
- Improved performance of wallet saving
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Removed

- All `redis` integrations and dependencies

### Fixed

- Wrong documentation
- Bad method calls for `sync/async` methods
- Cast rounds to integers
- Only commit data when `saveBlockCommit` is called
- Various bad method calls for expected query results
- Sorting of votes during SPV
- Added a missing index for the `block_id` column in the `transactions` table
- Moved the wallets integrity check after the wallet rebuild process to avoid false positive blockchain rebuilds
- Insert bignumber objects as strings to avoid rounding issues caused by `Number.MAX_SAFE_INTEGER`

## 0.1.0 - 2018-09-11

### Added

- initial release
