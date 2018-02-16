const config = require('app/core/config')
const goofy = require('app/core/goofy')

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

module.exports = async function () {
  config.init('config/devnet')
}
