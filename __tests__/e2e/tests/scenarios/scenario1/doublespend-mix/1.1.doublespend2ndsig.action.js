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
            // ignore 2nd sign registration tx type as we already have a 2nd signature
            if ([firstTxType, secondTxType].indexOf("secondSignRegistration") < 0) {
                const wallets = secondTxsTypes[secondTxType];

                transactions.push(
                    _genTransaction(firstTxType, wallets),
                    _genTransaction(secondTxType, wallets)
                );
            }
        }
    }

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        noncesByAddress[wallets[2].address] = noncesByAddress[wallets[2].address]
            ? noncesByAddress[wallets[2].address].plus(1)
            : Utils.BigNumber.make(1);

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


        return transaction
            .withFee(utils.fees[type])
            .withNonce(noncesByAddress[wallets[2].address])
            .withPassphrase(wallets[2].passphrase)
            .withSecondPassphrase(wallets[3].passphrase)
            .createOne()
    }
};
