"use strict";

const { Managers, Utils, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to the multisig wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[9];
    const multisigAddress = Identities.Address.fromMultiSignatureAsset(shared.multisigRegistration.asset.multiSignature);
    let transaction1 = TransactionFactory.transfer(multisigAddress, 1000 * Math.pow(10, 8), "send coins to multisig wallet")
        .withFee(0.1 * Math.pow(10, 8))
        .withNonce(Utils.BigNumber.make(3))
        .withPassphrase(senderWallet.passphrase)
        .createOne();

    await testUtils.POST("transactions", {
        transactions: [transaction1],
    });
};
