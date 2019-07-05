"use strict";

const { Managers } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[5]; // better use a different delegate for each scenario initial transfer
    let transaction1 = TransactionFactory.transfer(utils.senderWallet.address, 1000 * Math.pow(10, 8), "send coins to new wallet")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(senderWallet.passphrase)
        .createOne();

    await testUtils.POST("transactions", {
        transactions: [transaction1],
    });
};
