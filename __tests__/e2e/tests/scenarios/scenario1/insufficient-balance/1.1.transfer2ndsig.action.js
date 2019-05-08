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
        Transactions.BuilderFactory
            .transfer()
            .amount(1100 * Math.pow(10, 8))
            .recipientId(utils.transfer2ndsigRecipient.address)
            .vendorField("transfer with 2nd signature with insufficient balance")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.transfer2ndsigSender.passphrase)
            .secondSign(utils.transfer2ndsigSender2.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
