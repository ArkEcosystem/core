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
        TransactionFactory.delegateRegistration("dummydelegate1")
            .withFee(25 * Math.pow(10, 8))
            .withPassphrase(utils.doubleDelRegSender.passphrase)
            .createOne(),
        TransactionFactory.delegateRegistration("dummydelegate2")
            .withFee(25 * Math.pow(10, 8))
            .withNonce(Utils.BigNumber.make(1))
            .withPassphrase(utils.doubleDelRegSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
