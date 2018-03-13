const prompts = require('prompts')
const arkjs = require('arkjs')
const questions = require('./questions')
const { onCancel, readConfig } = require('commander/utils')
// const pm2 = require('pm2')

module.exports = async () => {
  if (!readConfig('delegates').bip38) require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password && response.address) {
    if (arkjs.crypto.validateAddress(response.address, readConfig('network').pubKeyHash)) {
      console.log('start forger')
    } else {
      throw new Error('Invalid Address Provided')
    }

    // pm2.connect((err) => {
    //   if (err) {
    //     console.error(err)
    //     process.exit(2)
    //   }

    //   pm2.start('./ecosystems/devnet.config.js', (err, apps) => {
    //     pm2.disconnect()

    //     if (err) throw err
    //   })
    // })
  }
}
