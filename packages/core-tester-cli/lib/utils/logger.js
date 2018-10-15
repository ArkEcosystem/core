const pino = require('pino')

module.exports = pino({
  name: 'ark-tester-cli',
  safe: true,
  prettyPrint: true
})
