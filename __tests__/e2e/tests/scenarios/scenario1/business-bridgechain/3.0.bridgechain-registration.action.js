"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the bridgechain registration transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory
            .bridgechainRegistration(utils.bridgechainRegistrationAsset)
            .withNonce(Utils.BigNumber.make(2))
            .withPassphrase(utils.wallets.businessRegistration.passphrase)
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions });
};
