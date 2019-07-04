"use strict";

const { Managers } = require("@arkecosystem/crypto");
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
            const wallets = secondTxsTypes[secondTxType];
            transactions.push(
                _genTransaction(firstTxType, wallets, noncesByAddress),
                _genTransaction(secondTxType, wallets, noncesByAddress)
            );
        });
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets, nonces) {
        let nonce = nonces[wallets[0].address];
        if (!nonce) {
            nonce = TransactionFactory.getNonce(Identities.PublicKey.fromPassphrase(wallets[0].passphrase));
            nonces[wallets[0].address] = nonce;
        }

        let transaction;
        switch (type) {
            case "transfer":
                transaction = TransactionFactory.transfer(wallets[1].address, utils.transferAmount)
                break;
            case "vote":
                transaction = TransactionFactory.vote(delegates[2].publicKey);
                break;
            case "secondSignRegistration":
                transaction = TransactionFactory.secondSignature(wallets[1].passphrase);
                break;
            case "delegateRegistration":
                transaction = TransactionFactory.delegateRegistration(wallets[0].address.slice(0, 10).toLowerCase(),
                );
                break;
        }

        nonces[wallets[0].address] = nonce.plus(1);

        return transaction
            .withFee(utils.fee[type])
            .withPassphrase(wallets[0].passphrase)
            .withNonce(nonce.plus(1))
            .createOne()
    }
};
