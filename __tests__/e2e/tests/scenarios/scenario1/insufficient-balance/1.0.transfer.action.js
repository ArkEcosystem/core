"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Attempt to spend with insufficient balance
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        Transactions.BuilderFactory.transfer()
            .amount(1100 * Math.pow(10, 8))
            .recipientId(utils.transferRecipient.address)
            .vendorField("transfer with insufficient balance")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.transferSender.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
