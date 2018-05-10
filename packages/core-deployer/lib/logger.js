const pino = require('pino')
const pretty = pino.pretty({
  formatter: (data, util) => {
    return `${util.prefix}: ${util.asColoredText(data, data.msg)}`
  }
})
pretty.pipe(process.stdout)

const logger = pino({
  name: 'ark-tester-cli',
  safe: true
}, pretty)

module.exports = logger
