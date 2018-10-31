# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Return forged rewards and fees via v2 API
- Return error feedback for transaction posting via v2 API
- Cache block heights to reduce database load
- Implement database repositories
- Limit the number of transactions per request if posting
- `ownerId` property for transaction searches
- Blockchains endpoint to provide information like supply
- Allow registration of additional plugins

### Changed
- Use the IANA format for the API vendor in the `Accept` header
- Use the official `hapi-api-version` dependency
- Return ports as integers
- Improved some error messages
- Return broadcast IDs for improved feedback
- Sort peers by latency
- Stricter validation of parameters
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Removed
- All `redis` integrations and dependencies

### Fixed
- Return the delegate list in the v1 format with correct limits
- Add the missing `vendorField` property to transactions
- Broken search in the v2 API for blocks and transactions
- Various search, sort and pagination issues
- Failing search because of unknown parameters
- Properly handle CORS headers
- Race condition that would result in duplicate transactions in the transaction pool
- Fixed the value returned by `unconfirmedBalance`
- Various inconsistencies of string/integer values in the v1 API
- Various inconsistencies of property names in the v1 API
- Various validation schemas
- Added missing `orderBy` property for block transaction sorting
- Crashes caused by bad sorting handling

## 0.1.1 - 2018-06-14

### Added
- initial release
