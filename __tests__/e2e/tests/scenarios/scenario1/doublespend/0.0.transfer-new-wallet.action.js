"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[2]; // better use a different delegate for each scenario initial transfer
    let nonce = Utils.BigNumber.make(1);

    const transactions = [
        TransactionFactory.transfer(utils.doubleTransferSender.address, 1000 * Math.pow(10, 8), "send coins for double spend - transfer")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(1))
            .createOne(),
        TransactionFactory.transfer(utils.doubleTransfer2ndsigSender.address, 1000 * Math.pow(10, 8), "send coins for double spend - transfer with 2nd sig")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(2))
            .createOne(),
        TransactionFactory.transfer(utils.doubleVoteSender.address, 1.5 * Math.pow(10, 8), "send coins for double spend - vote")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(3))
            .createOne(),
        TransactionFactory.transfer(utils.doubleDelRegSender.address, 35 * Math.pow(10, 8), "send coins for double spend - delegate registration")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(4))
            .createOne(),
        TransactionFactory.transfer(utils.double2ndsigRegSender.address, 7 * Math.pow(10, 8), "send coins for double spend - 2nd signature registration")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(5))
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
