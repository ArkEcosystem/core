"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        Transactions.BuilderFactory.transfer()
            .amount(1000 * Math.pow(10, 8))
            .recipientId(utils.doubleTransferSender.address)
            .vendorField("send coins for double spend - transfer")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        Transactions.BuilderFactory.transfer()
            .amount(1000 * Math.pow(10, 8))
            .recipientId(utils.doubleTransfer2ndsigSender.address)
            .vendorField("send coins for double spend - transfer with 2nd sig")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        Transactions.BuilderFactory.transfer()
            .amount(1.5 * Math.pow(10, 8))
            .recipientId(utils.doubleVoteSender.address)
            .vendorField("send coins for double spend - vote")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        Transactions.BuilderFactory.transfer()
            .amount(35 * Math.pow(10, 8))
            .recipientId(utils.doubleDelRegSender.address)
            .vendorField("send coins for double spend - delegate registration")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
        Transactions.BuilderFactory.transfer()
            .amount(7 * Math.pow(10, 8))
            .recipientId(utils.double2ndsigRegSender.address)
            .vendorField("send coins for double spend - 2nd signature registration")
            .fee(0.1 * Math.pow(10, 8))
            .sign(delegates[0].passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
