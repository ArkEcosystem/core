"use strict";

const { Managers, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send multisig registration transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const passphrases = [
        utils.multiSender1.passphrase,
        utils.multiSender2.passphrase,
        utils.multiSender3.passphrase,
        utils.multiSender4.passphrase,
        utils.multiSender5.passphrase,
    ];
    const participants = passphrases.map(p => Identities.PublicKey.fromPassphrase(p));

    const transactions = [
        TransactionFactory.multiSignature(participants, 3)
            .withPassphrase(utils.multiSender1.passphrase)
            .withPassphraseList(passphrases)
            .createOne()
    ];
    shared.multisigRegistration = transactions[0];

    await testUtils.POST("transactions", { transactions }, 1); // to node 1
};
