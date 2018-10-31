# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed
- Moved all API calls from v1 to v2
- Using in-memory peer list rather then fetching it via API
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Fixed
- Sign transaction *after* filling in the recipientId and amount
- Fixed the failing test-suite
- BIP38 functionality

## 0.1.1 - 2018-06-14

### Added
- initial release
