"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    const transactions = [];
    Object.keys(utils.walletsMix).forEach(firstTxType => {
        const secondTxsTypes = utils.walletsMix[firstTxType];

        Object.keys(secondTxsTypes).forEach(secondTxType => {
            const wallets = secondTxsTypes[secondTxType];
            const transferAmount = _balanceNeededFromTxMix(firstTxType, secondTxType);
            transactions.push(
                transactionBuilder
                    .transfer()
                    .amount(transferAmount)
                    .recipientId(wallets[0].address)
                    .vendorField(`init double spend ${firstTxType} - ${secondTxType}`)
                    .fee(0.1 * Math.pow(10, 8))
                    .sign(delegates[0].passphrase)
                    .getStruct(),
                transactionBuilder
                    .transfer()
                    .amount(utils.fees.secondSignRegistration + transferAmount)
                    .recipientId(wallets[2].address)
                    .vendorField(`init double spend ${firstTxType} - ${secondTxType}`)
                    .fee(0.1 * Math.pow(10, 8))
                    .sign(delegates[0].passphrase)
                    .getStruct(),
            );
        });
    });

    await testUtils.POST("transactions", { transactions });

    function _balanceNeededFromTxMix(txType1, txType2) {
        // we want to have 1 arkstoshi less than the amount needed for the 2 transactions
        return utils.amountNeeded[txType1] + utils.amountNeeded[txType2] - 1;
    }
};
