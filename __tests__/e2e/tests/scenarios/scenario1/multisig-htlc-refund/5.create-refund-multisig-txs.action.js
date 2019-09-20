"use strict";

const { Managers, Utils, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Claim signing tx with multisig wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");
    
    const multisigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(shared.transactions.multisigRegistration.asset.multiSignature);
    
    // 1st transaction : "normal" htlc lock transaction that we refund without issue
    shared.refundTransactions.normal = TransactionFactory.htlcRefund(
            {
                lockTransactionId: shared.lockTransactions.normal.id,
            }
        ) 
        .withSenderPublicKey(multisigPublicKey)
        .withNonce(Utils.BigNumber.make(1))
        .withPassphraseList([
            utils.multiSender1.passphrase,
            utils.multiSender2.passphrase,
            utils.multiSender3.passphrase,
        ])
        .createOne();

    await testUtils.POST("transactions", { transactions: [ shared.refundTransactions.normal ] }, 1); // to node 1
};
