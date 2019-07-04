"use strict";

const { Managers, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the transactions (1 of each type)
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    const noncesByAddress = {};

    Object.keys(utils.wallets).forEach(txType => {
        const wallets = utils.wallets[txType];

        transactions.push(_genTransaction(txType, wallets));
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        let nonce = noncesByAddress[wallets[0].address];
        if (!nonce) {
            nonce = TransactionFactory.getNonce(Identities.PublicKey.fromPassphrase(wallets[0].passphrase));
            noncesByAddress[wallets[0].address] = nonce;
        }

        let transaction;
        switch (type) {
            case "transfer":
                transaction = TransactionFactory.transfer(wallets[1].address, 2 * Math.pow(10, 8))
                break;
            case "vote":
                transaction = TransactionFactory.vote(delegates[2].publicKey)
                break;
            case "secondSignRegistration":
                transaction = TransactionFactory.secondSignature(wallets[1].passphrase);
                break;
            case "delegateRegistration":
                transaction = TransactionFactory.delegateRegistration(
                    wallets[0].address.slice(0, 10).toLowerCase(),
                );
                break;
            case "ipfs":
                transaction = TransactionFactory.ipfs("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
                break;
        }

        noncesByAddress[wallets[0].address] = nonce.plus(1);

        return transaction
            .withFee(utils.fees[type])
            .withNonce(nonce.plus(1))
            .withPassphrase(wallets[0].passphrase)
            .createOne();
    }
};
