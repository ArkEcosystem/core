## gemfile
### A Gemfile.lock parser for Node.js represented with JSON.
#### Installation
```bash
$ npm install gemfile
```
#### API
```javascript
// Takes a path to a Gemfile.lock.
parse(filename) // String => Promise => String
parseSync(filename) // String => String

// Takes the Gemfile.lock in String format.
interpret(gemfile) // String => String
```
#### Output Expectations
1. Anything that looks like a path will be identifiable by `.path`.
2. Anything that looks like a package version will be identifiable by `.version`.
3. Anything that uses a remote resource that is **not** [https://rubygems.org](https://rubygems.org) will be identifiable by `.outsourced`.
4. Anything that looks like a SHA-1 will be identifiable by `.sha`.
6. Everything other than "BUNDLED WITH" is an object.
5. "BUNDLED WITH" is _not_ an Object, but rather a String containing the version.

#### Tests
```bash
$ npm test
```

#### Contributions
Please feel free to improve the script and submit a [pull request](https://github.com/treycordova/gemfile/compare).
