'use strict'

const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const utils = require('./utils')
const testUtils = require('../../../../lib/utils/test-utils')

/**
 * Attempt to spend with insufficient balance
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    client.setConfig(NetworkManager.findByName("testnet"))

    const transactions = [
      transactionBuilder
        .transfer()
        .amount(1100 * Math.pow(10, 8))
        .recipientId(utils.transferRecipient.address)
        .vendorField('transfer with insufficient balance')
        .fee(0.1 * Math.pow(10, 8))
        .sign(utils.transferSender.passphrase)
        .getStruct()
    ]

    await testUtils.POST('transactions', { transactions })
}