"use strict";

const { Managers, Identities, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Attempt to double spend
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
            // ignore 2nd sign registration tx type as we already have a 2nd signature
            if ([firstTxType, secondTxType].indexOf("secondSignRegistration") < 0) {
                const wallets = secondTxsTypes[secondTxType];

                transactions.push(
                    _genTransaction(firstTxType, wallets),
                    _genTransaction(secondTxType, wallets)
                );
            }
        });
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        let nonce = noncesByAddress[wallets[2].address];
        if (!nonce) {
            nonce = Utils.BigNumber.make(1);
            noncesByAddress[wallets[2].address] = nonce;
        }

        let transaction;
        switch (type) {
            case "transfer":
                transaction = TransactionFactory.transfer(wallets[1].address, utils.transferAmount)
                break;
            case "vote":
                transaction = TransactionFactory.vote(delegates[2].publicKey);
                break;
            case "delegateRegistration":
                transaction = TransactionFactory.delegateRegistration(
                    wallets[2].address.slice(0, 10).toLowerCase(),
                );
                break;
        }

        noncesByAddress[wallets[2].address] = nonce.plus(1);

        return transaction
            .withFee(utils.fees[type])
            .withNonce(nonce.plus(1))
            .withPassphrase(wallets[2].passphrase)
            .withSecondPassphrase(wallets[3].passphrase)
            .createOne()
    }
};
