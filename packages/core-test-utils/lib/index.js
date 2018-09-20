const { red } = require('chalk')
const matchers = require('./matchers')

const jestExpect = global.expect

if (jestExpect !== undefined) {
  jestExpect.extend(matchers)
} else {
  /* eslint-disable no-console */
  console.error(red('Unable to find Jest\'s global expect.'))
    /* eslint-enable no-console */
}

module.exports = {
  generateTransactions: require('./generators/transactions'),
  generateWallets: require('./generators/wallets'),
  helpers: require('./helpers/helpers')
}
