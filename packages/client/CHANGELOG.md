# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.1.10 - 2018-10-24

### Fixed
- Use the configured `core-api` port instead of the `core-p2p` port, which would fail (https://github.com/ArkEcosystem/core/pull/1138)
- Wrong loader methods (https://github.com/ArkEcosystem/core/pull/1194)

## 0.1.9 - 2018-10-13

### Fixed
- Handle v2 endpoints when finding peers (https://github.com/ArkEcosystem/core/pull/1103)

## 0.1.8 - 2018-10-12

### Changed
- Use 5 second timeout for finding peers (https://github.com/ArkEcosystem/core/pull/1103)

### Fixed
- Get peer response data correctly (https://github.com/ArkEcosystem/core/pull/1103)

## 0.1.7 - 2018-10-12

### Fixed
- Add query parameters to the v2 endpoints.(https://github.com/ArkEcosystem/core/pull/1103)

## 0.1.6 - 2018-10-09

### Fixed
- Use the definitive `accept` header instead of the previous one (https://github.com/ArkEcosystem/core/pull/1082)

## 0.1.5 - 2018-10-05

### Fixed
- Use the `accept` header instead of api-version to avoid CORS problems (https://github.com/ArkEcosystem/core/pull/1012)

## 0.1.4 - 2018-09-20

### Fixed
- Fix API client HTTP params (query string) (https://github.com/ArkEcosystem/core/pull/1015)

## 0.1.3

...

## 0.1.1 - 2018-06-14

### Added
- initial release
