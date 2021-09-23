<!-- SHADOW_SECTION_LOGO_START -->

<div><img alt="Logo" src="https://raw.githubusercontent.com/wessberg/browserslist-generator/master/documentation/asset/logo.png" height="150"   /></div>

<!-- SHADOW_SECTION_LOGO_END -->

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_START -->

> A library that makes generating and validating Browserslists a breeze!

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_END -->

<!-- SHADOW_SECTION_BADGES_START -->

<a href="https://npmcharts.com/compare/%40wessberg%2Fbrowserslist-generator?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/%40wessberg%2Fbrowserslist-generator.svg"    /></a>
<a href="https://www.npmjs.com/package/%40wessberg%2Fbrowserslist-generator"><img alt="NPM version" src="https://badge.fury.io/js/%40wessberg%2Fbrowserslist-generator.svg"    /></a>
<a href="https://david-dm.org/wessberg/browserslist-generator"><img alt="Dependencies" src="https://img.shields.io/david/wessberg%2Fbrowserslist-generator.svg"    /></a>
<a href="https://github.com/wessberg/browserslist-generator/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/wessberg%2Fbrowserslist-generator.svg"    /></a>
<a href="https://github.com/prettier/prettier"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"    /></a>
<a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"    /></a>
<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Support on Patreon" src="https://img.shields.io/badge/patreon-donate-green.svg"    /></a>

<!-- SHADOW_SECTION_BADGES_END -->

<!-- SHADOW_SECTION_DESCRIPTION_LONG_START -->

## Description

<!-- SHADOW_SECTION_DESCRIPTION_LONG_END -->

This is a library that makes it easier to work with [browserslists](https://github.com/browserslist/browserslist).
It can do things like generating a Browserslist that targets only browsers that support - _or don't support_ - specific required features, or even generate a Browserslist from a User Agent string!
It can also do the same in reverse - match a Browserslist on a user agent.
A _Feature_ is anything that can be found on [caniuse](https://caniuse.com/) or [MDN](https://github.com/mdn/browser-compat-data).

<!-- SHADOW_SECTION_FEATURES_START -->

### Features

<!-- SHADOW_SECTION_FEATURES_END -->

- Generating a Browserslist based on features
- Generating a Browserslist based on an ECMA version
- Generating a browserslist based on a User Agent string
- Checking if a User Agent string supports specific features
- Checking if a browserslist supports specific features
- Checking if a browserslist supports a specific ECMA version
- Getting the most appropriate ECMA version for a browserslist

<!-- SHADOW_SECTION_FEATURE_IMAGE_START -->

<!-- SHADOW_SECTION_FEATURE_IMAGE_END -->

<!-- SHADOW_SECTION_TOC_START -->

## Table of Contents

- [Description](#description)
  - [Features](#features)
- [Table of Contents](#table-of-contents)
- [Install](#install)
  - [npm](#npm)
  - [Yarn](#yarn)
  - [pnpm](#pnpm)
- [Usage](#usage)
  - [Generating a Browserslist based on features](#generating-a-browserslist-based-on-features)
  - [Checking if a User Agent supports a specific feature](#checking-if-a-user-agent-supports-a-specific-feature)
  - [Checking if a Browserslist supports a specific feature](#checking-if-a-browserslist-supports-a-specific-feature)
  - [Generating a Browserslist based on a ECMAScript version](#generating-a-browserslist-based-on-a-ecmascript-version)
    - [Checking if a Browserslist supports a specific ECMAScript version](#checking-if-a-browserslist-supports-a-specific-ecmascript-version)
    - [Getting the most appropriate ECMAScript version for a Browserslist](#getting-the-most-appropriate-ecmascript-version-for-a-browserslist)
    - [Possible ECMAScript versions](#possible-ecmascript-versions)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [Backers](#backers)
  - [Patreon](#patreon)
- [FAQ](#faq)
  - [What is some cool example of a use case for this library?](#what-is-some-cool-example-of-a-use-case-for-this-library)
- [License](#license)

<!-- SHADOW_SECTION_TOC_END -->

<!-- SHADOW_SECTION_INSTALL_START -->

## Install

### npm

```
$ npm install @wessberg/browserslist-generator
```

### Yarn

```
$ yarn add @wessberg/browserslist-generator
```

### pnpm

```
$ pnpm add @wessberg/browserslist-generator
```

<!-- SHADOW_SECTION_INSTALL_END -->

<!-- SHADOW_SECTION_USAGE_START -->

## Usage

<!-- SHADOW_SECTION_USAGE_END -->

### Generating a Browserslist based on features

When deciding which Browsers and environments to support, it is quite common to make
the decision based on feature support. With this library, you no longer have to neither look up
Browser support and manually write a Browserslist, nor make sure to keep it up-to-date.
Instead, simply declare the features that should be available:

```typescript
import {browsersWithSupportForFeatures} from "@wessberg/browserslist-generator";
// Generate a browserslist for browsers that support all of the given features
const browserslist = browsersWithSupportForFeatures("es6-module", "shadowdomv1", "custom-elementsv1");
```

### Checking if a User Agent supports a specific feature

This library offers simple ways that you can check if a given User Agent supports any amount of features.
This could be useful, among other things, for conditional bundle serving:

```typescript
import {userAgentSupportsFeatures} from "@wessberg/browserslist-generator";
if (userAgentSupportsFeatures(userAgentString, "javascript.builtins.Promise.finally")) {
	doA();
} else {
	doB();
}
```

### Checking if a Browserslist supports a specific feature

Given an existing Browserslist, this library can check if it supports one or more features.
This could be useful, among other things, for conditional bundle serving:

```typescript
import {browserslistSupportsFeatures} from "@wessberg/browserslist-generator";
if (browserslistSupportsFeatures(browserslist, "es6-module")) {
	useModernBundle();
} else {
	useLegacyBundle();
}
```

### Generating a Browserslist based on a ECMAScript version

When deciding which Browsers and environments to support, it is quite common to make
the decision based on a specific version of ECMAScript to target. For example, with the Typescript Compiler,
the `target` option takes an ECMAScript version and the Typescript Compiler then knows which transformations to apply accordingly.

```typescript
import {browsersWithSupportForEcmaVersion} from "@wessberg/browserslist-generator";
// Generate a browserslist for browsers that support the given version of ECMAScript
const browserslist = browsersWithSupportForEcmaVersion("es2015");
```

#### Checking if a Browserslist supports a specific ECMAScript version

Given an existing Browserslist, this library can also check if it supports a specific version of ECMAScript.
This could be useful, among other things, for conditional bundle serving:

```typescript
import {browserslistSupportsEcmaVersion} from "@wessberg/browserslist-generator";
if (browserslistSupportsEcmaVersion(browserslist, "es2015")) {
	useModernBundle();
} else {
	useLegacyBundle();
}
```

#### Getting the most appropriate ECMAScript version for a Browserslist

Given an existing Browserslist, this library can detect the most appropriate ECMAScript version to target.
This could be useful, for example, when using the Typescript compiler based on a Browserslist.

```typescript
import {getAppropriateEcmaVersionForBrowserslist} from "@wessberg/browserslist-generator";

const typescriptOptions = {
	// ...
	target: getAppropriateEcmaVersionForBrowserslist(browserslist)
};
```

#### Possible ECMAScript versions

All of the possible ECMAScript versions are:

- `es3`
- `es5`
- `es2015`
- `es2016`
- `es2017`
- `es2018`
- `es2019`
- `es2020`

<!-- SHADOW_SECTION_CONTRIBUTING_START -->

## Contributing

Do you want to contribute? Awesome! Please follow [these recommendations](./CONTRIBUTING.md).

<!-- SHADOW_SECTION_CONTRIBUTING_END -->

<!-- SHADOW_SECTION_MAINTAINERS_START -->

## Maintainers

| <a href="mailto:frederikwessberg@hotmail.com"><img alt="Frederik Wessberg" src="https://avatars2.githubusercontent.com/u/20454213?s=460&v=4" height="70"   /></a>                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Frederik Wessberg](mailto:frederikwessberg@hotmail.com)<br><strong>Twitter</strong>: [@FredWessberg](https://twitter.com/FredWessberg)<br><strong>Github</strong>: [@wessberg](https://github.com/wessberg)<br>_Lead Developer_ |

<!-- SHADOW_SECTION_MAINTAINERS_END -->

<!-- SHADOW_SECTION_BACKERS_START -->

## Backers

[Become a sponsor/backer](https://github.com/wessberg/browserslist-generator?sponsor=1) and get your logo listed here.

| <a href="https://usebubbles.com"><img alt="Bubbles" src="https://uploads-ssl.webflow.com/5d682047c28b217055606673/5e5360be16879c1d0dca6514_icon-thin-128x128%402x.png" height="70"   /></a> |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bubbles](https://usebubbles.com)<br><strong>Twitter</strong>: [@use_bubbles](https://twitter.com/use_bubbles)                                                                              |

### Patreon

<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Patrons on Patreon" src="https://img.shields.io/endpoint.svg?url=https://shieldsio-patreon.herokuapp.com/wessberg"  width="200"  /></a>

<!-- SHADOW_SECTION_BACKERS_END -->

<!-- SHADOW_SECTION_FAQ_START -->

## FAQ

<!-- SHADOW_SECTION_FAQ_END -->

### What is some cool example of a use case for this library?

Well, here's one I think is pretty neat:
You're building an app, and you care about serving the smallest amount of code to your users.
You've decided to build two bundles: One for browsers _with_, and one for browsers _without_ ES-module support.
You can now generate two Browserslists via `@wessberg/browserslist-generator`:

```typescript
browsersWithSupportForFeatures("es6-module");
browsersWithoutSupportForFeatures("es6-module");
```

Now, you can then pass each one into tools like `@babel/preset-env` and `postcss`.
On the server, you can use the function `userAgentSupportsFeatures` to check if the same features are supported and respond with resources that points to the right bundle.

<!-- SHADOW_SECTION_LICENSE_START -->

## License

MIT © [Frederik Wessberg](mailto:frederikwessberg@hotmail.com) ([@FredWessberg](https://twitter.com/FredWessberg)) ([Website](https://github.com/wessberg))

<!-- SHADOW_SECTION_LICENSE_END -->
