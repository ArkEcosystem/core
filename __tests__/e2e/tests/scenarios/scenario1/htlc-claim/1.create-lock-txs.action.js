"use strict";

const { Managers, Crypto, Utils } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');
const { htlcSecretHashHex } = require('../../../../../utils/fixtures');

/**
 * Send lock transactions, we need 4 lock transactions to then test :
 * - associated lock tx does not exist
 * - secret hash does not match
 * - not recipient of lock tx
 * - lock expired
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const nodesHeight = await testUtils.getNodesHeight();
    const lastHeight = Math.max(...nodesHeight);

    // "normal" htlc lock transaction that will allow to claim without issue
    shared.lockTransactions.normal = TransactionFactory.htlcLock(
            {
                secretHash: htlcSecretHashHex,
                expiration: {
                    type: 2,
                    value: lastHeight + 51 + 12,
                },
            },
            utils.htlcRecipient1.address,
            3 * Math.pow(10, 8)
        )
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.htlcSender.passphrase)
        .createOne();

    // htlc lock transaction that we will claim with a wrong unlock secret
    shared.lockTransactions.wrongSecret = TransactionFactory.htlcLock(
            {
                secretHash: htlcSecretHashHex,
                expiration: {
                    type: 2,
                    value: lastHeight + 51 + 12,
                },
            },
            utils.htlcRecipient2.address,
            3 * Math.pow(10, 8)
        )
        .withFee(0.1 * Math.pow(10, 8))
        .withNonce(Utils.BigNumber.make(1))
        .withPassphrase(utils.htlcSender.passphrase)
        .createOne();

    // htlc lock transaction that we will claim with a wallet not recipient of the lock tx
    shared.lockTransactions.notRecipient = TransactionFactory.htlcLock(
            {
                secretHash: htlcSecretHashHex,
                expiration: {
                    type: 2,
                    value: lastHeight + 51 + 12,
                },
            },
            utils.htlcRecipient3.address,
            3 * Math.pow(10, 8)
        )
        .withFee(0.1 * Math.pow(10, 8))
        .withNonce(Utils.BigNumber.make(2))
        .withPassphrase(utils.htlcSender.passphrase)
        .createOne();

    // htlc lock transaction that we will claim after lock expiration
    shared.lockTransactions.lockExpired = TransactionFactory.htlcLock(
            {
                secretHash: htlcSecretHashHex,
                expiration: {
                    type: 2,
                    value: lastHeight + 51 + 4,
                },
            },
            utils.htlcRecipient4.address,
            3 * Math.pow(10, 8)
        )
        .withFee(0.1 * Math.pow(10, 8))
        .withNonce(Utils.BigNumber.make(3))
        .withPassphrase(utils.htlcSender.passphrase)
        .createOne();

    await testUtils.POST("transactions", { transactions: Object.values(shared.lockTransactions) }, 1); // to node 1
};
