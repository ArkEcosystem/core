# ARK Core

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
