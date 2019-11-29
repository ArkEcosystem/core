"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Re-send B => C transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    // B => C transaction
    Managers.configManager.setFromPreset("testnet");

    // B => C
    let transaction2 = TransactionFactory.transfer(utils.c.address, 250 * Math.pow(10, 8), "retry transfer B => C")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.b.passphrase)
        .createOne();

    await testUtils.POST("transactions", { transactions: [transaction2] }, 1); // to node 1
};
