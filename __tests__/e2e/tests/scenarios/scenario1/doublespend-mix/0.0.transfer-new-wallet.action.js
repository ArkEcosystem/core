"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[3]; // better use a different delegate for each scenario initial transfer
    let nonce = Utils.BigNumber.make(1);
    const transactions = [];
    for (const firstTxType of Object.keys(utils.walletsMix)) {
        const secondTxsTypes = utils.walletsMix[firstTxType];

        for (const secondTxType of Object.keys(secondTxsTypes)) {
            const wallets = secondTxsTypes[secondTxType];
            const transferAmount = _balanceNeededFromTxMix(firstTxType, secondTxType);
            transactions.push(
                TransactionFactory.transfer(wallets[0].address, transferAmount, `init double spend ${firstTxType} - ${secondTxType}`)
                    .withFee(0.1 * Math.pow(10, 8))
                    .withPassphrase(senderWallet.passphrase)
                    .withNonce(nonce.plus(1))
                    .createOne(),

                TransactionFactory.transfer(wallets[2].address, utils.fees.secondSignRegistration + transferAmount, `init double spend ${firstTxType} - ${secondTxType}`)
                    .withFee(0.1 * Math.pow(10, 8))
                    .withPassphrase(senderWallet.passphrase)
                    .withNonce(nonce.plus(2))
                    .createOne(),
            );

            nonce = nonce.plus(2);
        }
    }

    await testUtils.POST("transactions", { transactions });

    function _balanceNeededFromTxMix(txType1, txType2) {
        // we want to have 1 arkstoshi less than the amount needed for the 2 transactions
        return utils.amountNeeded[txType1] + utils.amountNeeded[txType2] - 1;
    }
};
