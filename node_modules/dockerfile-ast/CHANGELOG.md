# Changelog
All notable changes to this project will be documented in this file.

## [0.0.16] - 2019-05-22
### Fixed
- only allow alphanumeric and underscore characters in variable names ([#58](https://github.com/rcjsuen/dockerfile-ast/issues/58))

## [0.0.15] - 2019-05-21
### Fixed
- variables in `FROM` should return `true` for `isDefined()` if it is defined in the `ARG` instructions above it ([#56](https://github.com/rcjsuen/dockerfile-ast/issues/56))
- variables in `FROM` should return `true` for `isBuildVariable()` if it is defined in the `ARG` instructions above it ([#57](https://github.com/rcjsuen/dockerfile-ast/issues/57))

## [0.0.14] - 2019-04-28
### Added
- `ImageTemplate`
  - `getRange()` ([#53](https://github.com/rcjsuen/dockerfile-ast/issues/53))

### Changed
- the enum value for `Keyword.ADD` was incorrectly assigned to `"ARG"`, it is now assigned to `"ADD"` ([#51](https://github.com/rcjsuen/dockerfile-ast/issues/51))
  - this is a breaking change but presumably no consumers were relying on this incorrect behaviour
- `Dockerfile`'s `getContainingImage()` has been changed for comments immediately before a build stage
  - previously, they would return the build stage that came after the comment, now they will simply return the entire Dockerfile
  - this is because the comment is actually ambiguous as it may be a commented out instruction for the build stage that came before the comment

### Fixed
- correct incorrectly assigned string enum value for `Keyword.ADD` ([#51](https://github.com/rcjsuen/dockerfile-ast/issues/51))
- ensure quotation marks and apostrophes are included for expanded arguments in `Instruction`'s `getExpandedArguments()` if they surround a variable ([#52](https://github.com/rcjsuen/dockerfile-ast/issues/52))
- fixed `getComments()` for build stages so that they will not simply return empty arrays ([#54](https://github.com/rcjsuen/dockerfile-ast/issues/54))
  - the returned comments will only be from comments contained within the `FROM` instruction and the last instruction of that build stage

## [0.0.13] - 2018-12-20
### Fixed
- prevent TypeError from being thrown by `Dockerfile`'s `resolveVariable(string, number)` when an invalid line number is provided ([#48](https://github.com/rcjsuen/dockerfile-ast/issues/48))
- correct compiler error due to incomplete interface signature ([#46](https://github.com/rcjsuen/dockerfile-ast/issues/46))

## [0.0.12] - 2018-08-10
### Fixed
- handle quoted properties on separate lines properly for `ENV`s and `LABEL`s ([#44](https://github.com/rcjsuen/dockerfile-ast/issues/45))

## [0.0.11] - 2018-06-16
### Fixed
- ignore initial `ENV`s when resolving variables in `FROM`s ([#44](https://github.com/rcjsuen/dockerfile-ast/issues/44))

## [0.0.10] - 2018-06-16
### Added
- `From`
  - `getImageRange()` ([#43](https://github.com/rcjsuen/dockerfile-ast/issues/43))
  - `getImageTag()` ([#43](https://github.com/rcjsuen/dockerfile-ast/issues/43))
  - `getImageDigest()` ([#43](https://github.com/rcjsuen/dockerfile-ast/issues/43))
  - `getRegistry()` ([#43](https://github.com/rcjsuen/dockerfile-ast/issues/43))
  - `getRegistryRange()` ([#43](https://github.com/rcjsuen/dockerfile-ast/issues/43))

### Changed
- [upgraded the dependency of Mocha](https://github.com/mochajs/mocha/issues/2791) from 3.x to 5.x
  - versions prior to 4.x of Mocha dependended on Growl 1.9.2 which contained a [security vulnerability](https://github.com/tj/node-growl/issues/60)
  - as Mocha is a `devDependencies` module, there is no reason to believe that the `dockerfile-ast` module itself was affected by this vulnerability

### Fixed
- do not resolve reinitialized `ARG` variables with `ENV` instructions at the top of the Dockerfile ([#42](https://github.com/rcjsuen/dockerfile-ast/issues/42))
- improve parsing of `FROM` instructions that refer to variables ([#39](https://github.com/rcjsuen/dockerfile-ast/issues/39))

## [0.0.9] - 2018-05-28
### Fixed
- handle comments in the last line of a file properly for `ARG`, `ENV`, and `LABEL` ([#40](https://github.com/rcjsuen/dockerfile-ast/issues/40))
- parse `ARG` instructions properly when its value contains an unclosed quote ([#41](https://github.com/rcjsuen/dockerfile-ast/issues/41))

## [0.0.8] - 2018-05-27
### Fixed
- prevent `getVariables()` from throwing an error if a `LABEL` has no value defined ([#38](https://github.com/rcjsuen/dockerfile-ast/issues/38))

## [0.0.7] - 2018-05-25
### Added
- `ParserDirective`
  - `toString()` ([#4](https://github.com/rcjsuen/dockerfile-ast/issues/4))
- `PropertyInstruction`
  - `getPropertyArguments()` ([#37](https://github.com/rcjsuen/dockerfile-ast/issues/37))
- `Variable`
  - `getModifier()` ([#27](https://github.com/rcjsuen/dockerfile-ast/issues/27))
  - `getModifierRange()` ([#33](https://github.com/rcjsuen/dockerfile-ast/issues/33))
  - `getSubstitutionParameter()` ([#27](https://github.com/rcjsuen/dockerfile-ast/issues/27))
  - `getSubstitutionRange()` ([#33](https://github.com/rcjsuen/dockerfile-ast/issues/33))
  - `toString()` ([#4](https://github.com/rcjsuen/dockerfile-ast/issues/4))

### Changed
- `PropertyInstruction`
  - `getArguments()` ([#34](https://github.com/rcjsuen/dockerfile-ast/issues/34))
    - to make this function more predictable, `PropertyInstruction` no longer overrides this function with its own implementation, existing callers should call `getPropertyArguments()` instead if the old behaviour is desired
```TypeScript
// this function has been changed to possibly not return the same thing
// depending on the structure of the instruction's arguments
let args = propertyInstruction.getArguments();
// to get the same behaviour in 0.0.6, use getPropertyArguments() instead
let args = propertyInstruction.getPropertyArguments();
```

### Fixed
- resolve references to uninitialized `ARG` variables against `ARG` variables before the first `FROM` if present ([#26](https://github.com/rcjsuen/dockerfile-ast/issues/26))
- change `FROM` to parse its image argument correctly if it is in a private registry ([#28](https://github.com/rcjsuen/dockerfile-ast/issues/28))
- fix parsing issue with quoted keys and values in `ARG`, `ENV`, and `LABEL` ([#30](https://github.com/rcjsuen/dockerfile-ast/issues/30))
- ignore equals signs that are found inside quotes ([#29](https://github.com/rcjsuen/dockerfile-ast/issues/29))
- prevent arguments from being split up if they span multiple lines via escaped newlines ([#34](https://github.com/rcjsuen/dockerfile-ast/issues/34))
- prevent variables from being split up if they span multiple lines via escaped newlines ([#35](https://github.com/rcjsuen/dockerfile-ast/issues/35))

## [0.0.6] - 2018-04-19
### Changed
- `Property`
  - `getRawValue()` has been renamed to `getUnescapedValue()` ([#25](https://github.com/rcjsuen/dockerfile-ast/issues/25))
    - the underlying implementation of the function has not changed so it should be easy for clients to migrate to the new API

### Fixed
- fix parsing of spaces embedded within a variable replacement in `ARG`, `ENV`, and `LABEL` instructions ([#24](https://github.com/rcjsuen/dockerfile-ast/issues/24))

## [0.0.5] - 2018-04-15
### Fixed
- fix resolution of `ARG` variables that are used in a `FROM` ([#22](https://github.com/rcjsuen/dockerfile-ast/issues/22))
- prevent error from being thrown if an invalid line number is specified by `Dockerfile`'s `getAvailableVariables(number)` function ([#23](https://github.com/rcjsuen/dockerfile-ast/issues/23))

## [0.0.4] - 2018-04-03
### Added
- `JSONArgument extends Argument` ([#20](https://github.com/rcjsuen/dockerfile-ast/issues/20))
  - `getJSONRange()`
  - `getJSONValue()`
- `Comment`
  - `toString()` ([#4](https://github.com/rcjsuen/dockerfile-ast/issues/4))

### Changed
- `JSONInstruction`
  - `getJSONStrings()` now returns `JSONArgument[]` instead of `Argument[]`
    - since `JSONArgument` extends `Argument`, any existing code should continue to work with no code changes required

## [0.0.3] - 2018-02-10
### Added
- `From`
  - `getImageNameRange()` ([#16](https://github.com/rcjsuen/dockerfile-ast/issues/16))
- `Instruction`
  - `toString()` ([#4](https://github.com/rcjsuen/dockerfile-ast/issues/4))

### Fixed
- calling `ImageTemplate`'s `getAvailableVariables(number)` with a Dockerfile should only return the variables that are declared in the build stage of the given line ([#15](https://github.com/rcjsuen/dockerfile-ast/issues/15))
- correct `From`'s `getImageName()` to return the right name for the image if it is pointing at a digest ([#17](https://github.com/rcjsuen/dockerfile-ast/issues/17))
- calling `ImageTemplate`'s `getAvailableVariables(number)` on a line with a `FROM` should return variables defined by the Dockerfile's initial `ARG` instructions (if any) ([#18](https://github.com/rcjsuen/dockerfile-ast/issues/18))

## [0.0.2] - 2018-01-20
### Added
- `Argument`
  - `toString()` ([#4](https://github.com/rcjsuen/dockerfile-ast/issues/4))
- `Variable`
  - `isBuildVariable()` ([#13](https://github.com/rcjsuen/dockerfile-ast/issues/13))
  - `isDefined()` ([#12](https://github.com/rcjsuen/dockerfile-ast/issues/12))
  - `isEnvironmentVariable()` ([#13](https://github.com/rcjsuen/dockerfile-ast/issues/13))

### Fixed
- restrict variable resolution to the containing build stage ([#14](https://github.com/rcjsuen/dockerfile-ast/issues/14))

### Removed
- `Argument`'s `getRawValue()` function has been removed ([#10](https://github.com/rcjsuen/dockerfile-ast/issues/10))
```TypeScript
// this convenience function has been removed
let rawValue = argument.getRawValue();
// to retrieve the identical value, use the following code instead
import { TextDocument } from 'vscode-languageserver-types';
let document = TextDocument.create(uri, languageId, version, buffer);
let range = argument.getRange();
let rawValue = buffer.substring(document.offsetAt(range.start), document.offsetAt(range.end));
```

## 0.0.1 - 2017-12-20
### Added
- Dockerfile parser
  - handles escape characters
  - preserves comments
  - provides variable lookup and resolution

[0.0.16]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.15...v0.0.16
[0.0.15]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.14...v0.0.15
[0.0.14]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/rcjsuen/dockerfile-ast/compare/v0.0.1...v0.0.2
