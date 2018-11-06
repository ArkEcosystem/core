# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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

## 0.1.0 - 2018-09-11

### Added
- initial release
