# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 2.0.15 - 2018-12-11

### Fixed

- Ensure no local peers are enlisted
- Ensure the IP of the TCP connection is used

## 2.0.14 - 2018-12-10

### Fixed

- Reset last downloaded block when block is discarded

## 2.0.13 - 2018-12-07

### Fixed

- Ensure safe integer range for block height lookups via API

## 2.0.12 - 2018-12-06

### Fixed

- Perform second-signature checks in the `canApply` logic of multi-signatures

## 2.0.11 - 2018-12-05

### Added

- Store executed migrations in the database

### Changed

- Increase cache generation timeout and make it configurable

## 2.0.1 - 2018-12-05

### Changed

- Improved performance for block and transaction queries by adding more indices on critical columns

### Fixed

- Take milestones into account for supply calculations

## 2.0.0 - 2018-12-03

### Changed

- Dropped node.js 9 as minimum requirement in favour of node.js 10

## 0.1.1 - 2018-06-14

### Added

- initial release
