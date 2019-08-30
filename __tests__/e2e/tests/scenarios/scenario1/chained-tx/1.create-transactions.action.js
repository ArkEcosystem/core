"use strict";

const { Managers } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send A => B and B => C transactions
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    // A => B and B => C transactions
    Managers.configManager.setFromPreset("testnet");

    // A => B
    let transaction1 = TransactionFactory.transfer(utils.b.address, 300 * Math.pow(10, 8), "transfer A => B")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.a.passphrase)
        .createOne();


    // B => C
    let transaction2 = TransactionFactory.transfer(utils.c.address, 250 * Math.pow(10, 8), "transfer B => C")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.b.passphrase)
        .createOne();

    await testUtils.POST("transactions", { transactions: [transaction1, transaction2] }, 1); // to node 1
};
