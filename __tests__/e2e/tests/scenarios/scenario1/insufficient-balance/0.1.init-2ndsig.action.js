'use strict'

const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const utils = require('./utils')
const testUtils = require('../../../../lib/utils/test-utils')

/**
 * 2nd signature registration for future transfer with 2nd signature
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    client.setConfig(NetworkManager.findByName("testnet"))

    const transactions = [
      transactionBuilder
        .secondSignature()
        .signatureAsset(utils.transfer2ndsigSender2.passphrase)
        .fee(5 * Math.pow(10, 8))
        .sign(utils.transfer2ndsigSender.passphrase)
        .getStruct()
    ]

    await testUtils.POST('transactions', { transactions })
}