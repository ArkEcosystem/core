"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        Transactions.BuilderFactory
            .transfer()
            .amount(600 * Math.pow(10, 8))
            .recipientId(utils.doubleTransfer2ndsigRecipient.address)
            .vendorField("first part of double spend")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.doubleTransfer2ndsigSender.passphrase)
            .secondSign(utils.doubleTransfer2ndsigSender2.passphrase)
            .getStruct(),
        Transactions.BuilderFactory
            .transfer()
            .amount(600 * Math.pow(10, 8))
            .recipientId(utils.doubleTransfer2ndsigRecipient.address)
            .vendorField("second part of double spend")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.doubleTransfer2ndsigSender.passphrase)
            .secondSign(utils.doubleTransfer2ndsigSender2.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
