'use strict'

const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const utils = require('./utils')
const { delegates } = require('../../../../lib/utils/testnet')
const testUtils = require('../../../../lib/utils/test-utils')

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    client.setConfig(NetworkManager.findByName("testnet"))

    const transactions = [
      transactionBuilder
        .vote()
        .votesAsset([`+${delegates[2].publicKey}`])
        .fee(1 * Math.pow(10, 8))
        .sign(utils.doubleVoteSender.passphrase)
        .getStruct(),
      transactionBuilder
        .vote()
        .votesAsset([`+${delegates[3].publicKey}`])
        .fee(1 * Math.pow(10, 8))
        .sign(utils.doubleVoteSender.passphrase)
        .getStruct()
    ]

    await testUtils.POST('transactions', { transactions })
}