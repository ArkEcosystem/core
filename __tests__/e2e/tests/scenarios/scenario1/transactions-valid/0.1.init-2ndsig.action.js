"use strict";

const { Managers, Identities, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Init 2nd signature wallets
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];

    for (const txType of Object.keys(utils.wallets)) {
        const wallets = utils.wallets[txType];

        transactions.push(
            TransactionFactory.secondSignature(wallets[3].passphrase)
                .withFee(utils.fees.secondSignRegistration)
                .withPassphrase(wallets[2].passphrase)
                .createOne(),
        );
    }

    await testUtils.POST("transactions", { transactions });
};
