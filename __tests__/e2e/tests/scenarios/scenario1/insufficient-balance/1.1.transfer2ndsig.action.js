"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
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
        TransactionFactory.transfer(utils.transfer2ndsigRecipient.address, 1100 * Math.pow(10, 8), "transfer with 2nd signature with insufficient balance")
            .withFee(0.1 * Math.pow(10, 8))
            .withNonce(Utils.BigNumber.make(1))
            .withPassphrase(utils.transfer2ndsigSender.passphrase)
            .withSecondPassphrase(utils.transfer2ndsigSender2.passphrase)
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
