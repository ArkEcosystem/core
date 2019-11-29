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

    for(const txType of Object.keys(utils.wallets)) {
        // ignore 2nd sign registration tx type as we already have a 2nd signature
        if (txType !== "secondSignRegistration") {
            const wallets = utils.wallets[txType];

            transactions.push(_genTransaction(txType, wallets));
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
                transaction = TransactionFactory.transfer(wallets[1].address, 2 * Math.pow(10, 8))
                break;
            case "vote":
                transaction = TransactionFactory.vote(delegates[2].publicKey);
                break;
            case "delegateRegistration":
                transaction = TransactionFactory.delegateRegistration(
                    wallets[2].address.slice(0, 10).toLowerCase(),
                );
                break;
            case "ipfs":
                transaction = TransactionFactory.ipfs("QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB");
                break;
        }

        return transaction
            .withFee(utils.fees[type])
            .withNonce(noncesByAddress[wallets[2].address])
            .withPassphrase(wallets[2].passphrase)
            .withSecondPassphrase(wallets[3].passphrase)
            .createOne();
    }
};
