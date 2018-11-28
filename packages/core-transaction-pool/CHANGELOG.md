# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.0 - 2018-12-03

### Added

- Delete pool wallet if no ballance or no transactions in pool
- Additional tests implemented
- Pool wallet manager implementation to guard the pool
- Blocking of sender if not in conditions or whitelisted
- Limit votes to 1 per wallet in pool via guard
- Return error feedback from the guard
- Handle dynamic fees
- Better transaction ping
- Broadcasting on launch of relay
- Cap the number of transactions the pool can hold

### Changed

- Splitting guard methods into more smaller units
- GetForgingTransactions moved to Transaction Pool
- Broadcasting only valid transactions further (verified, and wallet manager applied)
- Guard updated with wallet manager
- Handle numbers as `BigNumber` instances
- Dropped node.js 9 as minimum requirement in favour of node.js 10
- Adjusted timeouts & lifetimes
- No longer add transactions that do not meet the fee requirements to the pool (BTC/ETH behaviour)
- No longer decline transactions that exceed the static fees
- Simplified the broadcasting logic
- Broadcast transactions when the pool is full

### Fixed

- Handling duplicates also on incomming payload level (before entering and checking with pool)
- Fix on applychained block - to use correct wallet and update from blockchain wallet only if necesary
- Call getTransactionIdsForForging() properly
- Properly log the transaction audit
- Properly determine valid transactions based on their type
- Handle unexpected errors in the guard
- Revert transactions with non-matching dynamic fees
- Revert excess transactions
- Reject transactions that have a timestamp from the future
- Remove invalid transactions from pool when receiving a bad block

## 0.1.1 - 2018-06-14

### Added

- initial release
