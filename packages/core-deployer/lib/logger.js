const pino = require('pino')

module.exports = pino({
  name: 'phantom-tester-cli',
  safe: true,
  prettyPrint: true,
})
