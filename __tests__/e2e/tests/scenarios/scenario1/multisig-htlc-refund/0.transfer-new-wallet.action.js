"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[11]; // better use a different delegate for each scenario initial transfer
    let transaction1 = TransactionFactory.transfer(utils.multiSender1.address, 1000 * Math.pow(10, 8), "send coins to multisig participant 1")
        .withFee(0.1 * Math.pow(10, 8))
        .withNonce(Utils.BigNumber.make(2))
        .withPassphrase(senderWallet.passphrase)
        .createOne();

    await testUtils.POST("transactions", {
        transactions: [transaction1],
    });
};
