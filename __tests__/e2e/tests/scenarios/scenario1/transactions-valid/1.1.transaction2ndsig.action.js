"use strict";

const { Managers, Identities, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send the transactions 2nd signed (1 of each type)
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    const noncesByAddress = {};

    Object.keys(utils.wallets).forEach(txType => {
        // ignore 2nd sign registration tx type as we already have a 2nd signature
        if (txType !== "secondSignRegistration") {
            const wallets = utils.wallets[txType];

            transactions.push(_genTransaction(txType, wallets));
        }
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
                transaction = TransactionFactory.transfer(wallets[1].address, 2 * Math.pow(10, 8))
                break;
            case "vote":
                transaction = TransactionFactory.vote(delegates[2].publicKey);
                break;
            case "delegateRegistration":
                transaction = TransactionFactory.delegateRegistration(wallets[2].address.slice(0, 10).toLowerCase(),
                );
                break;
            case "ipfs":
                transaction = TransactionFactory.ipfs("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
                break;
        }

        noncesByAddress[wallets[2].address] = nonce.plus(1);

        return transaction
            .withFee(utils.fees[type])
            .withNonce(nonce.plus(1))
            .withPassphrase(wallets[2].passphrase)
            .withSecondPassphrase(wallets[3].passphrase)
            .createOne();
    }
};
