# Contributing

Thanks for your interest in contributing to ARK-JS! Please take a moment to review this document **before submitting a pull request**.

## Bounty Program

ARK has a bounty program for all accepted PR (Pull Requests) for this repository

More information can be found at https://blog.ark.io/ark-github-development-bounty-113806ae9ffe

Before pushing PR, please [jump in our slack #development](https://ark.io/slack) channel in order to discuss your contributions or to connect with other ARK developers.

### Guidelines

- pickup any of the existing issues or if you find an issue make a PR,
- only one PR reward will be awarded per issue it fixes,
- solving an open issue will increase your chances to be picked up as any of the monthly bounty winners.

### Accepted PR

- increase general code quality,
- add meaningful tests,
- correct bug,
- add new features,
- improve documentation,
- create something new for ARK.

## Pull requests

**Please ask first before starting work on any significant new features.**

It's never a fun experience to have your pull request declined after investing a lot of time and effort into a new feature. To avoid this from happening, we request that contributors create [an issue](https://github.com/ArkEcosystem/ark-js/issues) to first discuss any significant new features.

## Coding standards

Our code formatting rules are defined in [.eslintrc](https://github.com/ArkEcosystem/ark-js/blob/master/.eslintrc). You can check your code against these standards by running:

```sh
yarn lint
```

To automatically fix any style violations in your code, you can run:

```sh
yarn lint --fix
```

## Running tests

You can run the test suite using the following commands:

```sh
yarn test
```

Please ensure that the tests are passing when submitting a pull request. If you're adding new features to ARK-JS, please include tests.
