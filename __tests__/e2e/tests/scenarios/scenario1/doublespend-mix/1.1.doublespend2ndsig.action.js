"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");

/**
 * Attempt to double spend
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    const transactions = [];
    Object.keys(utils.walletsMix).forEach(firstTxType => {
        const secondTxsTypes = utils.walletsMix[firstTxType];

        Object.keys(secondTxsTypes).forEach(secondTxType => {
            // ignore 2nd sign registration tx type as we already have a 2nd signature
            if ([firstTxType, secondTxType].indexOf("secondSignRegistration") < 0) {
                const wallets = secondTxsTypes[secondTxType];

                transactions.push(_genTransaction(firstTxType, wallets), _genTransaction(secondTxType, wallets));
            }
        });
    });

    await testUtils.POST("transactions", { transactions });

    function _genTransaction(type, wallets) {
        let transaction;
        switch (type) {
            case "transfer":
                transaction = transactionBuilder
                    .transfer()
                    .amount(utils.transferAmount)
                    .recipientId(wallets[1].address);
                break;
            case "vote":
                transaction = transactionBuilder.vote().votesAsset([`+${delegates[2].publicKey}`]);
                break;
            case "delegateRegistration":
                transaction = transactionBuilder
                    .delegateRegistration()
                    .usernameAsset(wallets[2].address.slice(0, 10).toLowerCase());
                break;
        }

        return transaction
            .fee(utils.fees[type])
            .sign(wallets[2].passphrase)
            .secondSign(wallets[3].passphrase)
            .getStruct();
    }
};
