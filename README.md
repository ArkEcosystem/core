# ARK Core

This repository is composed by 2 projects:
 - [Core](https://github.com/fix/ark-core/tree/master/packages/core)
 - [Client](https://github.com/fix/ark-core/tree/master/packages/client) (A.K.A `ark-js`)

## Development

#### Setup

```sh
lerna bootstrap
```
### **@arkecosystem/core**

------

#### Start

```sh
cd packages/core
yarn start:devnet
```

#### Adding a dependency

```sh
lerna add @arkecosystem/core[@version] [--dev]
```

### **@arkecosystem/client**

------

#### Building via webpack

```sh
lerna run prepublish
```

#### Adding a dependency

```sh
lerna add @arkecosystem/client[@version] [--dev]
```

## Publishing packages to the npm registry

```sh
lerna publish
```
