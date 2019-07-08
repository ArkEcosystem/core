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

    const senderWallet = delegates[4]; // better use a different delegate for each scenario initial transfer
    const nonce = Utils.BigNumber.make(1);

    const transactions = [
        TransactionFactory.transfer(utils.transferSender.address, 1000 * Math.pow(10, 8), "init for transfer")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(1))
            .createOne(),

        TransactionFactory.transfer(utils.transfer2ndsigSender.address, 1000 * Math.pow(10, 8), "init for transfer with 2nd sig")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(2))
            .createOne(),

        TransactionFactory.transfer(utils.voteSender.address, 0.5 * Math.pow(10, 8), "init for vote")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(3))
            .createOne(),

        TransactionFactory.transfer(utils.delRegSender.address, 15 * Math.pow(10, 8), "init for delegate registration")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(4))
            .createOne(),

        TransactionFactory.transfer(utils.secondsigRegSender.address, 3 * Math.pow(10, 8), "init for 2nd signature registration")
            .withFee(0.1 * Math.pow(10, 8))
            .withPassphrase(senderWallet.passphrase)
            .withNonce(nonce.plus(5))
            .createOne(),
    ];

    await testUtils.POST("transactions", { transactions });
};
