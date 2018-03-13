const prompts = require('prompts')
const arkjs = require('arkjs')
const questions = require('./questions')
const { onCancel, readConfig } = require('commander/utils')

module.exports = async () => {
  if (!readConfig('delegates').bip38) await require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password && response.address) {
    if (arkjs.crypto.validateAddress(response.address, readConfig('network').pubKeyHash)) {
      return console.log('start forger with password & address')
    }

    throw new Error('Invalid Address Provided')
  }
}
