"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        Transactions.BuilderFactory.delegateRegistration()
            .usernameAsset("dummydelegate1")
            .fee(25 * Math.pow(10, 8))
            .sign(utils.doubleDelRegSender.passphrase)
            .getStruct(),
        Transactions.BuilderFactory.delegateRegistration()
            .usernameAsset("dummydelegate2")
            .fee(25 * Math.pow(10, 8))
            .sign(utils.doubleDelRegSender.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
