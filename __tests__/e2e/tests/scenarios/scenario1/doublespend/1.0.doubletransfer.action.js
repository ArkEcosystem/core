"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    const transactions = [
        transactionBuilder
            .transfer()
            .amount(600 * Math.pow(10, 8))
            .recipientId(utils.doubleTransferRecipient.address)
            .vendorField("first part of double spend")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.doubleTransferSender.passphrase)
            .getStruct(),
        transactionBuilder
            .transfer()
            .amount(600 * Math.pow(10, 8))
            .recipientId(utils.doubleTransferRecipient.address)
            .vendorField("second part of double spend")
            .fee(0.1 * Math.pow(10, 8))
            .sign(utils.doubleTransferSender.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
