# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Message signing
- Message verification
- Sign transactions via WIF
- HDWallet handling

### Changed
- Handle numerical values as `BigNumber` instances
- Change `transaction.serialized` from `Buffer` to hex
- Exclude the network from the signing object
- Improved overall performance of the crypto by calling the `secp256k1` methods directly instead of using a BTC package

### Fixed
- Limit decimals to 0 to avoid floating numbers
- Properly verify block payload length
- Broken verification of faulty type 1 and 4
- Broken multisignature serialization

## 0.1.1 - 2018-06-14

### Added
- initial release
