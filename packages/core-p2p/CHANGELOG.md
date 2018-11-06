# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Support for next forger calculations
- Relay support for wake-up from forger (to sync before forging)
- Additional tests implemented
- Remote API authentication
- Return a 503 status code while the node is syncing/busy instead of crashing
- Updated peer heights on a regular basis
- Validate P2P headers
- Rule based peer banning to provide greater control
- Event emitting via API through the relay
- Configuration API
- Minimum peer version
- Peer whitelisting & blacklisting
- Common block checks

### Changed
- Network state calculation (new internal/networkState) taking PBFT into account
- Peer optimisations (blacklisting, whitelisting, coldstart) options for peers and forger
- Overall reduced the complexity of how the P2P API is structured
- Allow config to be retrieved without P2P headers
- Dropped node.js 9 as minimum requirement in favour of node.js 10

### Removed
- Remove threading for block downloads

### Fixed
- Handle "no common block" banning
- Various cases of bad error handling
- Various inconsistencies between the v1 P2P API and current implementation
- Return ports as integers
- Handle CORS requests to the P2P API
- Return the last block if no height is provided to a method
- Race condition that would result in duplicate transactions in the transaction pool

## 0.1.1 - 2018-06-14

### Added
- initial release
