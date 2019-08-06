"use strict";

const { Managers } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
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
        TransactionFactory.vote(delegates[2].publicKey)
            .withFee(1 * Math.pow(10, 8))
            .withPassphrase(utils.voteSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
