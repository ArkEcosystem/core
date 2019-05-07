"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    Object.keys(utils.walletsMix).forEach(firstTxType => {
        const secondTxsTypes = utils.walletsMix[firstTxType];

        Object.keys(secondTxsTypes).forEach(secondTxType => {
            const wallets = secondTxsTypes[secondTxType];

            transactions.push(_genTransaction(firstTxType, wallets), _genTransaction(secondTxType, wallets));
        });
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        let transaction;
        switch (type) {
            case "transfer":
                transaction = Transactions.BuilderFactory
                    .transfer()
                    .amount(utils.transferAmount)
                    .recipientId(wallets[1].address);
                break;
            case "vote":
                transaction = Transactions.BuilderFactory.vote().votesAsset([`+${delegates[2].publicKey}`]);
                break;
            case "secondSignRegistration":
                transaction = Transactions.BuilderFactory.secondSignature().signatureAsset(wallets[1].passphrase);
                break;
            case "delegateRegistration":
                transaction = Transactions.BuilderFactory
                    .delegateRegistration()
                    .usernameAsset(wallets[0].address.slice(0, 10).toLowerCase());
                break;
        }

        return transaction
            .fee(utils.fees[type])
            .sign(wallets[0].passphrase)
            .getStruct();
    }
};
