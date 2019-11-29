"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the business registration transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory
            .businessRegistration(utils.businessRegistrationAsset)
            .withNonce(Utils.BigNumber.make(0))
            .withPassphrase(utils.wallets.businessRegistration.passphrase)
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions });
};
