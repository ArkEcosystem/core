"use strict";

const { Managers, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Send refund transactions, we need 3 refund transactions to test when :
 * - associated lock tx does not exist
 * - not sender of lock tx
 * - lock not expired
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    // 1st transaction : "normal" htlc lock transaction that we refund without issue
    shared.refundTransactions.normal = TransactionFactory.htlcRefund(
            {
                lockTransactionId: shared.lockTransactions.normal.id,
            }
        )
        .withPassphrase(utils.htlcSender.passphrase)
        .withNonce(Utils.BigNumber.make(3))
        .createOne();

    // 2nd transaction : htlc lock transaction that we refund with a wallet not sender of the lock tx
    shared.refundTransactions.notSender = TransactionFactory.htlcRefund(
            {
                lockTransactionId: shared.lockTransactions.notSender.id,
            }
        )
        .withPassphrase(utils.htlcNotSender.passphrase)
        .createOne();

    // 3rd transaction : htlc lock transaction that we will refund before lock expiration
    shared.refundTransactions.lockNotExpired = TransactionFactory.htlcRefund(
            {
                lockTransactionId: shared.lockTransactions.lockNotExpired.id,
            }
        )
        .withPassphrase(utils.htlcBeforeExpiration.passphrase)
        .createOne();

    await testUtils.POST("transactions", { transactions: Object.values(shared.refundTransactions) }, 1); // to node 1
};
