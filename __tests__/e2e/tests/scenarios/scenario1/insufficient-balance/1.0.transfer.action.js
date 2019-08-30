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
        TransactionFactory.transfer(utils.transferRecipient.address, 1100 * Math.pow(10, 8), "transfer with insufficient balance")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(utils.transferSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
