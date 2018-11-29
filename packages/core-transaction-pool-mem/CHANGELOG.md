# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.0 - 2018-12-03

### Added

- Get transactions from mem pool ordered by fee

### Changed

- Test flushing wallets
- Reduce nondeterminism in the transactions expiration tests
- Dropped node.js 9 as minimum requirement in favour of node.js 10
- Lazy sort transactions to improve performance
- Don't always purge expired transactions when checking for existence to improve performance

### Fixed

- Ensure the SQL database exists
- Sorting of transactions by fee

## 0.1.0 - 2018-10-12

### Added

- initial release
