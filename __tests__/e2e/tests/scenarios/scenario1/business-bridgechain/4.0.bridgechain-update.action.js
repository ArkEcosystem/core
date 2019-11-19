"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the bridgechain update transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [
        TransactionFactory
            .bridgechainUpdate(utils.bridgechainUpdateAsset)
            .withNonce(Utils.BigNumber.make(3))
            .withPassphrase(utils.wallets.businessRegistration.passphrase)
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions });
};
