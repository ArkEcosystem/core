# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Option for `smartBridge` values
- Default values for ports
- Multi Signature support
- Vote support
- Flood option

### Changed
- Moved from modules to classes to reduce duplication
- Use the v2 API for any API calls
- Handle duplicate transaction IDs
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Fixed
- Undefined passphrases for the `overridingPassphrase` option in transfers

## 0.1.1 - 2018-06-14

### Added
- initial release
