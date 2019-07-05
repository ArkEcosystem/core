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
    const noncesByAddress = {};

    Object.keys(utils.walletsMix).forEach(firstTxType => {
        const secondTxsTypes = utils.walletsMix[firstTxType];
        Object.keys(secondTxsTypes).forEach(secondTxType => {
            const wallets = secondTxsTypes[secondTxType];

            let nonce = noncesByAddress[wallets[2].address];
            if (!nonce) {
                nonce = Utils.BigNumber.ZERO;
                noncesByAddress[wallets[2].address] = nonce;
            }

            transactions.push(
                TransactionFactory.secondSignature(wallets[3].passphrase)
                    .withFee(utils.fees.secondSignRegistration)
                    .withPassphrase(wallets[2].passphrase)
                    .withNonce(nonce.plus(1))
                    .createOne()
            );

            noncesByAddress[wallets[2].address] = nonce.plus(1);
        });
    });

    await testUtils.POST("transactions", { transactions });
};
