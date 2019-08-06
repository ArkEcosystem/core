"use strict";

const { Managers } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * 2nd signature registration for future transfer with 2nd signature
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory.secondSignature(utils.transfer2ndsigSender2.passphrase)
            .withFee(5 * Math.pow(10, 8))
            .withPassphrase(utils.transfer2ndsigSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
