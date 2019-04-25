"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    const transactions = [
        transactionBuilder
            .transfer()
            .amount(1000 * Math.pow(10, 8))
            .recipientId(utils.transferSender.address)
            .vendorField("init for transfer")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        transactionBuilder
            .transfer()
            .amount(1000 * Math.pow(10, 8))
            .recipientId(utils.transfer2ndsigSender.address)
            .vendorField("init for transfer with 2nd sig")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        transactionBuilder
            .transfer()
            .amount(0.5 * Math.pow(10, 8))
            .recipientId(utils.voteSender.address)
            .vendorField("init for vote")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        transactionBuilder
            .transfer()
            .amount(15 * Math.pow(10, 8))
            .recipientId(utils.delRegSender.address)
            .vendorField("init for delegate registration")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        transactionBuilder
            .transfer()
            .amount(3 * Math.pow(10, 8))
            .recipientId(utils.secondsigRegSender.address)
            .vendorField("init for 2nd signature registration")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
