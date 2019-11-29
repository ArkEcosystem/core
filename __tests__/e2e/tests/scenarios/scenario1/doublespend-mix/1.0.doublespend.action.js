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

    for (const firstTxType of Object.keys(utils.walletsMix)) {
        const secondTxsTypes = utils.walletsMix[firstTxType];

        for (const secondTxType of Object.keys(secondTxsTypes)) {
            const wallets = secondTxsTypes[secondTxType];
            transactions.push(
                _genTransaction(firstTxType, wallets),
                _genTransaction(secondTxType, wallets)
            );
        }
    }

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        noncesByAddress[wallets[0].address] = noncesByAddress[wallets[0].address]
            ? noncesByAddress[wallets[0].address].plus(1)
            : Utils.BigNumber.ZERO;

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

        return transaction
            .withFee(utils.fees[type])
            .withPassphrase(wallets[0].passphrase)
            .withNonce(noncesByAddress[wallets[0].address])
            .createOne()
    }
};
