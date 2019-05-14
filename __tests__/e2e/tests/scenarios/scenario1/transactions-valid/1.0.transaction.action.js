"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");

/**
 * Send the transactions (1 of each type)
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    Object.keys(utils.wallets).forEach(txType => {
        const wallets = utils.wallets[txType];

        transactions.push(_genTransaction(txType, wallets));
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        let transaction;
        switch (type) {
            case "transfer":
                transaction = Transactions.BuilderFactory.transfer()
                    .amount(2 * Math.pow(10, 8))
                    .recipientId(wallets[1].address);
                break;
            case "vote":
                transaction = Transactions.BuilderFactory.vote().votesAsset([`+${delegates[2].publicKey}`]);
                break;
            case "secondSignRegistration":
                transaction = Transactions.BuilderFactory.secondSignature().signatureAsset(wallets[1].passphrase);
                break;
            case "delegateRegistration":
                transaction = Transactions.BuilderFactory.delegateRegistration().usernameAsset(
                    wallets[0].address.slice(0, 10).toLowerCase(),
                );
                break;
            case "ipfs":
                transaction = Transactions.BuilderFactory.ipfs()
                    .version(2)
                    .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
                break;
        }

        return transaction
            .fee(utils.fees[type])
            .sign(wallets[0].passphrase)
            .getStruct();
    }
};
