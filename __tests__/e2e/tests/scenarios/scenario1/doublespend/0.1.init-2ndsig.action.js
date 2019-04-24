'use strict'

const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const utils = require('./utils')
const testUtils = require('../../../../lib/utils/test-utils')

/**
 * 2nd signature registration for double spend with 2nd signature
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    client.setConfig(NetworkManager.findByName("testnet"))

    const transactions = [
      transactionBuilder
        .secondSignature()
        .signatureAsset(utils.doubleTransfer2ndsigSender2.passphrase)
        .fee(5 * Math.pow(10, 8))
        .sign(utils.doubleTransfer2ndsigSender.passphrase)
        .getStruct()
    ]

    await testUtils.POST('transactions', { transactions })
}