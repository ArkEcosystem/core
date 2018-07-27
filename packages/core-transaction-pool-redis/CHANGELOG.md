# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
## 0.0.1 - 2018-07-27
- Adding new methods to the pool for size, sender size, sender accept
- GetForgingTransactions and AcceptChainedBlock moved out of specific implementation to the parent plugin: core-transaction-pool
- Handling Duplicates on parent level before entering guard
- Additional tests

## 0.0.1 - 2018-05-31
### Added
- initial release
