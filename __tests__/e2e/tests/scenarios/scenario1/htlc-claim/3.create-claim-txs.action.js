"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send claim transactions, we need 4 claim transactions to test when :
 * - associated lock tx does not exist
 * - secret hash does not match
 * - not recipient of lock tx
 * - lock expired
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    // 1st transaction : "normal" htlc lock transaction that we claim without issue
    shared.claimTransactions.normal = TransactionFactory.htlcClaim(
            {
                lockTransactionId: shared.lockTransactions.normal.id,
                unlockSecret: shared.lockTransactions.normal.recipientId.slice(0, 32),
            }
        )
        .withPassphrase(utils.htlcRecipient1.passphrase)
        .createOne();

    // 2nd transaction : htlc lock transaction that we claim with a wrong secret hash
    shared.claimTransactions.wrongSecret = TransactionFactory.htlcClaim(
            {
                lockTransactionId: shared.lockTransactions.wrongSecret.id,
                unlockSecret: "thatisasecretthatissooooooowrong",
            }
        )
        .withPassphrase(utils.htlcRecipient2.passphrase)
        .createOne();

    // 3rd transaction : htlc lock transaction that we claim with a wallet not recipient of the lock tx
    shared.claimTransactions.notRecipient = TransactionFactory.htlcClaim(
            {
                lockTransactionId: shared.lockTransactions.notRecipient.id,
                unlockSecret: shared.lockTransactions.notRecipient.recipientId.slice(0, 32),
            }
        )
        .withPassphrase(utils.htlcNotRecipient.passphrase)
        .createOne();

    // 4th transaction : htlc lock transaction that we will claim after lock expiration
    shared.claimTransactions.lockExpired = TransactionFactory.htlcClaim(
            {
                lockTransactionId: shared.lockTransactions.lockExpired.id,
                unlockSecret: shared.lockTransactions.lockExpired.recipientId.slice(0, 32),
            }
        )
        .withPassphrase(utils.htlcRecipient4.passphrase)
        .createOne();

    await testUtils.POST("transactions", { transactions: Object.values(shared.claimTransactions) }, 1); // to node 1
};
