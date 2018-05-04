const pino = require('pino')
const pretty = pino.pretty()
pretty.pipe(process.stdout)

const logger = pino({
  name: 'ark-tester-cli',
  safe: true
}, pretty)

module.exports = logger
