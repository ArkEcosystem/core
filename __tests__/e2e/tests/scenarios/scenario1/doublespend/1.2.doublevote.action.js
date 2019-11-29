"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
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
        TransactionFactory.vote(delegates[2].publicKey)
            .withFee(1 * Math.pow(10, 8))
            .withPassphrase(utils.doubleVoteSender.passphrase)
            .createOne(),
        TransactionFactory.vote(delegates[3].publicKey)
            .withFee(1 * Math.pow(10, 8))
            .withNonce(Utils.BigNumber.make(1))
            .withPassphrase(utils.doubleVoteSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
