"use strict";

const { Managers, Identities, Utils } = require("@arkecosystem/crypto");
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

    for(const txType of Object.keys(utils.wallets)) {
        const wallets = utils.wallets[txType];
        transactions.push(_genTransaction(txType, wallets));
    }

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        noncesByAddress[wallets[0].address] = noncesByAddress[wallets[0].address]
            ? noncesByAddress[wallets[0].address].plus(1)
            : Utils.BigNumber.ZERO;

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

        return transaction
            .withFee(utils.fees[type])
            .withNonce(noncesByAddress[wallets[0].address])
            .withPassphrase(wallets[0].passphrase)
            .createOne();
    }
};
