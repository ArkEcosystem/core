const pino = require('pino')
const pretty = pino.pretty({
  formatter: (data, util) => `${util.prefix}: ${util.asColoredText(data, data.msg)}`
})
pretty.pipe(process.stdout)

module.exports = pino({
  name: 'ark-tester-cli',
  safe: true
}, pretty)
