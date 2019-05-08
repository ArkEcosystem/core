"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Re-send B => C transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    // B => C transaction
    Managers.configManager.setFromPreset("testnet");

    // B => C
    let transaction2 = Transactions.BuilderFactory
        .transfer()
        .amount(250 * Math.pow(10, 8))
        .recipientId(utils.c.address)
        .vendorField("transfer B => C")
        .fee(0.1 * Math.pow(10, 8))
        .sign(utils.b.passphrase)
        .getStruct();

    await testUtils.POST("transactions", { transactions: [transaction2] }, 1); // to node 1
};
