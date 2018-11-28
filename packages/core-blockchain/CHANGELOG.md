# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.0 - 2018-12-03

### Added

- More graceful handling of shutdown
- State Storage to handle state machine data
- Peer banning after forks

### Changed

- Improved the logic of how blocks are being processed
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Fixed

- Properly stop blockchain if manually started
- Various state issues with the last downloaded blocks
- Various state issues with the wallet manager
- Properly handle forks while idle

## 0.1.1 - 2018-06-14

### Added

- initial release
