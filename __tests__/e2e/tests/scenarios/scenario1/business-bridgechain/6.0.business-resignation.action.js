"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the business resignation transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory
            .businessResignation(utils.businessResignationAsset)
            .withNonce(Utils.BigNumber.make(5))
            .withPassphrase(utils.wallets.businessRegistration.passphrase)
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions });
};
