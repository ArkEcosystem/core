"use strict";

const { Managers } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Attempt to spend with insufficient balance
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory.secondSignature(utils.secondsigRegSender2.passphrase)
            .withFee(5 * Math.pow(10, 8))
            .withPassphrase(utils.secondsigRegSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
