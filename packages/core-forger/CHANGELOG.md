# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Ping blockchain (relay node) to wake-up one slot before forging
- PBFT call to p2p layer to assess network state

### Changed
- Split monitor and client to seperate HTTP logic
- Read BIP38 from `.env`
- Read Passphrase from `.env`
- Dropped node.js 9 as minimum requirement in favour of node.js 10

## 0.1.1 - 2018-06-14

### Added
- initial release
