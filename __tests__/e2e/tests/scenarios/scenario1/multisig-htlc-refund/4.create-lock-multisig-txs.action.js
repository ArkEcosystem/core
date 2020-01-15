"use strict";

const { Managers, Utils, Identities, Crypto } = require("@arkecosystem/crypto");
const utils = require("./utils");
const shared = require("./shared");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');
const { htlcSecretHashHex } = require('../../../../../utils/fixtures');

/**
 * Send valid multisig htlc lock transaction
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const multisigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(shared.transactions.multisigRegistration.asset.multiSignature);

    const nodesHeight = await testUtils.getNodesHeight();
    const lastHeight = Math.max(...nodesHeight);

    // "normal" htlc lock transaction that will allow to claim without issue
    shared.lockTransactions.normal = TransactionFactory.htlcLock(
            {
                secretHash: htlcSecretHashHex,
                expiration: {
                    type: 2,
                    value: lastHeight + 51 + 1,
                },
            },
            utils.randomWallet1.address,
            3 * Math.pow(10, 8)
        )
        .withFee(0.1 * Math.pow(10, 8))
        .withSenderPublicKey(multisigPublicKey)
        .withPassphraseList([
            utils.multiSender1.passphrase,
            utils.multiSender2.passphrase,
            utils.multiSender3.passphrase,
        ])
        .createOne();

    await testUtils.POST("transactions", { transactions: [ shared.lockTransactions.normal ] }, 1); // to node 1
};
