"use strict";

const { Managers, Utils, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send multisig transactions, we need 3 transactions to test when :
 * - valid multisig transaction with 3 participants signing
 * - not enough signatures : only 2 participants signing
 * - wrong signature : signed with 3 participants but 1 is wrong
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");
    
    const multisigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(shared.multisigRegistration.asset.multiSignature);
    
    const transactions = [
        TransactionFactory.transfer(utils.randomWallet1.address, 1e8)
            .withFee(1e7)
            .withSenderPublicKey(multisigPublicKey)
            .withPassphraseList([
                utils.multiSender1.passphrase,
                utils.multiSender2.passphrase,
                utils.multiSender3.passphrase,
            ])
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions }, 1); // to node 1
};
