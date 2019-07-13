"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory.transfer(utils.doubleTransferRecipient.address, 600 * Math.pow(10, 8), "first part of double spend")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(utils.doubleTransferSender.passphrase)
            .createOne(),
        TransactionFactory.transfer(utils.doubleTransferRecipient.address, 600 * Math.pow(10, 8), "second part of double spend")
            .withFee(0.1 * Math.pow(10, 8))
            .withNonce(Utils.BigNumber.make(1))
            .withPassphrase(utils.doubleTransferSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
