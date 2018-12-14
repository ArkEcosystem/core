# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

-   Migrated from JavaScript to TypeScript

### Fixed

-   Resolved an issue with the `resolveOptions` method that would result in options being resolved for plugins that are not registered in the container.

## 0.2.0 - 2018-12-03

### Added

-   Support plugin extensions
-   More graceful handling of shutdown
-   Silent shutdown to hide output
-   Configuration through a remote peer
-   Expose the git commit hash on development networks

### Fixed

-   Cast numerical strings to numbers

### Changed

-   No longer load the `.env` file in test environments
-   Dropped node.js 9 as minimum requirement in favour of node.js 10

## 0.1.1 - 2018-06-14

### Added

-   initial release
