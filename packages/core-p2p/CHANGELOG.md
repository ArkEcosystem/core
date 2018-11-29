# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.2.0 - 2018-12-03

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
- Peer banning after forks
- Reject forgers as peers
- Recovery after a fork
- Enabled rate-limiting
- Enable/Disable peer discovery
- Dump the peer list on shutdown and load it on next start

### Changed

- Network state calculation (new internal/networkState) taking PBFT into account
- Peer optimisations (blacklisting, whitelisting, coldstart) options for peers and forger
- Overall reduced the complexity of how the P2P API is structured
- Allow config to be retrieved without P2P headers
- Dropped node.js 9 as minimum requirement in favour of node.js 10
- Exclude transactions from broadcasting if they are in the transaction pool
- Reduced timeouts for HTTP requests
- Allow 20/rps instead of 1000/rpm
- Limit the number of peers a transaction is broadcasted to
- Broadcast transactions in chunks based on `maxTransactionsPerRequest`
- Improved ping behaviour by remembering ping times

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
- Accept v1 peers
- Avoid errors when banning peers before the state storage is not ready yet
- Grab transactions based on the transactions per block

## 0.1.1 - 2018-06-14

### Added

- initial release
