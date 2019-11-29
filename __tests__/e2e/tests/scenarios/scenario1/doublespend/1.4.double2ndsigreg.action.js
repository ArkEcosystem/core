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
        TransactionFactory.secondSignature(utils.double2ndsigRegSender2.passphrase)
            .withFee(5 * Math.pow(10, 8))
            .withPassphrase(utils.double2ndsigRegSender.passphrase)
            .createOne(),
        TransactionFactory.secondSignature(utils.double2ndsigRegSender3.passphrase)
            .withFee(5 * Math.pow(10, 8))
            .withNonce(Utils.BigNumber.make(1))
            .withPassphrase(utils.double2ndsigRegSender.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
