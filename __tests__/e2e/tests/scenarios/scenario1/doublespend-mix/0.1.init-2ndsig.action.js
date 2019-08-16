"use strict";

const { Managers, Identities, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require("../../../../../helpers/transaction-factory");

/**
 * Init 2nd signature wallets
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    const noncesByAddress = {};

    Object.keys(utils.walletsMix).forEach(firstTxType => {
        const secondTxsTypes = utils.walletsMix[firstTxType];
        Object.keys(secondTxsTypes).forEach(secondTxType => {
            const wallets = secondTxsTypes[secondTxType];

            transactions.push(
                TransactionFactory.secondSignature(wallets[3].passphrase)
                    .withFee(utils.fees.secondSignRegistration)
                    .withPassphrase(wallets[2].passphrase)
                    .createOne(),
            );
        });
    });

    await testUtils.POST("transactions", { transactions });
};
