# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.6 - 2018-12-06

### Fixed

- Perform second-signature checks in the `canApply` logic of multi-signatures

## 0.2.5 - 2018-11-19

### Fixed

- Added signWithWif to sign mixin used for vote builder

## 0.2.4 - 2018-11-09

### Added

- Address Identity
- Keys Identity
- Private Key Identity
- Public Key Identity
- WIF Identity

### Fixed

- Comparison of upper/lower-case public keys
- Validate the vendor field length
- Use network version in transaction builder when signing with mixin

## 0.2.3 - 2018-10-26

### Added

- Allow Message signing with WIF

### Fixed

- Use network WIF as default for WIF operations

## 0.2.2 - 2018-10-23

### Added

- Message signing
- Message verification

## 0.2.1 - 2018-10-18

### Added

- Sign transactions via WIF
- HDWallet handling

### Changed

- Exclude the network from the signing object
- Handle numerical values as `BigNumber` instances
- Change `transaction.serialized` from `Buffer` to hex

### Fixed

- Limit decimals to 0 to avoid floating numbers
- Properly verify block payload length
- Broken verification of faulty type 1 and 4
- Broken multisignature serialization

## 0.2.0 - 2018-09-17

### Changed

- Improved overall performance of the crypto by calling the `secp256k1` methods directly instead of using a BTC package

## 0.1.2 - 2018-08-10

### Fixed

- Webpack build

### Removed

- Old and unused methods

## 0.1.1 - 2018-06-14

### Added

- initial release
