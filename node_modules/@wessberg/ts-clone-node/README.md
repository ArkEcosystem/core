<!-- SHADOW_SECTION_LOGO_START -->

<div><img alt="Logo" src="https://raw.githubusercontent.com/wessberg/ts-clone-node/master/documentation/asset/logo.png" height="150"   /></div>

<!-- SHADOW_SECTION_LOGO_END -->

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_START -->

> A library that helps you clone Nodes from a Typescript AST

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_END -->

<!-- SHADOW_SECTION_BADGES_START -->

<a href="https://npmcharts.com/compare/%40wessberg%2Fts-clone-node?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/%40wessberg%2Fts-clone-node.svg"    /></a>
<a href="https://www.npmjs.com/package/%40wessberg%2Fts-clone-node"><img alt="NPM version" src="https://badge.fury.io/js/%40wessberg%2Fts-clone-node.svg"    /></a>
<a href="https://david-dm.org/wessberg/ts-clone-node"><img alt="Dependencies" src="https://img.shields.io/david/wessberg%2Fts-clone-node.svg"    /></a>
<a href="https://github.com/wessberg/ts-clone-node/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/wessberg%2Fts-clone-node.svg"    /></a>
<a href="https://github.com/prettier/prettier"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"    /></a>
<a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"    /></a>
<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Support on Patreon" src="https://img.shields.io/badge/patreon-donate-green.svg"    /></a>

<!-- SHADOW_SECTION_BADGES_END -->

<!-- SHADOW_SECTION_DESCRIPTION_LONG_START -->

## Description

<!-- SHADOW_SECTION_DESCRIPTION_LONG_END -->

The Typescript Compiler API is very powerful and comes with a lot of `create` and `update` functions that can be used for creating and updating nodes in [Custom transformers](https://github.com/Microsoft/TypeScript/pull/13940) while visiting
a `SourceFile`. Under such circumstances, it is easy to run into problems if you reuse a Node in another part of the tree without properly cloning it, since the `parent` chain, as well as the `pos` and `end` values will have wrong values and will lead to malformed output after your transformations have been applied.

This can be cumbersome for example when you want to simply add or remove a specific modifier from an arbitrary node in a given position.
This library exports a `cloneNode` function that makes it easy to deep-clone a Node from a Typescript AST without any faulty parent links.
Additionally, you get a simple hook with which you can do simple things such as edit the top-level properties of the cloned object such as its modifiers, decorators, etc.

<!-- SHADOW_SECTION_FEATURES_START -->

### Features

<!-- SHADOW_SECTION_FEATURES_END -->

- Simple to use
- Extensible
- Supports dynamic TypeScript versions

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
  - [Peer Dependencies](#peer-dependencies)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Hooking into and altering transformations](#hooking-into-and-altering-transformations)
  - [Passing in a specific TypeScript version](#passing-in-a-specific-typescript-version)
  - [Setting parent pointers](#setting-parent-pointers)
  - [Setting original node pointers](#setting-original-node-pointers)
  - [Preserving comments](#preserving-comments)
  - [Preserving symbols](#preserving-symbols)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [Backers](#backers)
  - [Patreon](#patreon)
- [FAQ](#faq)
  - [What is the point of this library](#what-is-the-point-of-this-library)
- [License](#license)

<!-- SHADOW_SECTION_TOC_END -->

<!-- SHADOW_SECTION_INSTALL_START -->

## Install

### npm

```
$ npm install @wessberg/ts-clone-node
```

### Yarn

```
$ yarn add @wessberg/ts-clone-node
```

### pnpm

```
$ pnpm add @wessberg/ts-clone-node
```

### Peer Dependencies

`@wessberg/ts-clone-node` depends on `typescript`, so you need to manually install these as well.

<!-- SHADOW_SECTION_INSTALL_END -->

<!-- SHADOW_SECTION_USAGE_START -->

## Usage

<!-- SHADOW_SECTION_USAGE_END -->

To clone a Node from a Typescript AST, all you have to do is:

```typescript
import {cloneNode} from "@wessberg/ts-clone-node";

// Clone the Node
const clonedNode = cloneNode(someNode);
```

## Configuration

### Hooking into and altering transformations

You can pass in a hook that enables you to modify the clone, agnostic to the kind of Node it is.
For example:

```typescript
import {cloneNode} from "@wessberg/ts-clone-node";

// Clone the Node, and alter the modifiers such that they don't include a modifier pointing
// to the 'declare' keyword
const clonedNode = cloneNode(someNode, {
	hook: node => {
		return {
			modifiers: modifiers => ensureNoDeclareModifier(modifiers)
		};
	}
});
```

There is also a _'finalize'_ which is invoked after a node has been cloned at any recursive step from the top node, allowing you to perform
final alterations or track the node for other purposes.

```typescript
const clonedNode = cloneNode(someNode, {
	finalize: (clonedNode, oldNode) => trackSomething(clonedNode, oldNode)
});
```

### Passing in a specific TypeScript version

You can use pass a specific TypeScript to use as an option to `cloneNode`:

```typescript
cloneNode(someNode, {
	typescript: specialTypescriptVersion
});
```

This can be useful, for example, in an environment where multiple packages in the same project depends
on different TypeScript versions and you're relying on `cloneNode`.

### Setting parent pointers

By default, when you clone a node, it won't update the parent pointers such that you and TypeScripts compiler APIs can traverse the parent tree.
You can toggle this behavior with the `setParents` option:

```typescript
cloneNode(someNode, {
	setParents: true
});
```

### Setting original node pointers

By default, when you clone a node, it won't keep references to the original nodes recursively.
You can toggle this behavior with the `setOriginalNodes` option:

```typescript
cloneNode(someNode, {
	setOriginalNodes: true
});
```

### Preserving comments

By default, when you clone a node, comments will be preserved as much as possible and added to the cloned nodes as `emitNodes`.
You can toggle this behavior with the `preserveComments` option:

```typescript
cloneNode(someNode, {
	preserveComments: false
});
```

### Preserving symbols

By default, when you clone a node, it won't preserve symbols from the original nodes.
You can toggle this behavior with the `preserveSymbols` option:

```typescript
cloneNode(someNode, {
	preserveSymbols: true
});
```

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

[Become a sponsor/backer](https://github.com/wessberg/ts-clone-node?sponsor=1) and get your logo listed here.

| <a href="https://usebubbles.com"><img alt="Bubbles" src="https://uploads-ssl.webflow.com/5d682047c28b217055606673/5e5360be16879c1d0dca6514_icon-thin-128x128%402x.png" height="70"   /></a> |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bubbles](https://usebubbles.com)<br><strong>Twitter</strong>: [@use_bubbles](https://twitter.com/use_bubbles)                                                                              |

### Patreon

<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Patrons on Patreon" src="https://img.shields.io/endpoint.svg?url=https://shieldsio-patreon.herokuapp.com/wessberg"  width="200"  /></a>

<!-- SHADOW_SECTION_BACKERS_END -->

<!-- SHADOW_SECTION_FAQ_START -->

## FAQ

<!-- SHADOW_SECTION_FAQ_END -->

### What is the point of this library

If you've run into the kind of trouble I'm explaining here, you'll understand. If not, I'm happy for you. You can move along!

<!-- SHADOW_SECTION_LICENSE_START -->

## License

MIT © [Frederik Wessberg](mailto:frederikwessberg@hotmail.com) ([@FredWessberg](https://twitter.com/FredWessberg)) ([Website](https://github.com/wessberg))

<!-- SHADOW_SECTION_LICENSE_END -->
