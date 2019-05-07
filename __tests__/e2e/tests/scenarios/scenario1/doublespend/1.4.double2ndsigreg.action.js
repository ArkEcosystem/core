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
        Transactions.BuilderFactory
            .secondSignature()
            .signatureAsset(utils.double2ndsigRegSender2.passphrase)
            .fee(5 * Math.pow(10, 8))
            .sign(utils.double2ndsigRegSender.passphrase)
            .getStruct(),
        Transactions.BuilderFactory
            .secondSignature()
            .signatureAsset(utils.double2ndsigRegSender3.passphrase)
            .fee(5 * Math.pow(10, 8))
            .sign(utils.double2ndsigRegSender.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
