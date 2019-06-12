"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const transactions = [];
    Object.keys(utils.wallets).forEach(txType => {
        const wallets = utils.wallets[txType];
        const transferAmount = 100 * Math.pow(10, 8);
        transactions.push(
            Transactions.BuilderFactory.transfer()
                .amount(transferAmount)
                .recipientId(wallets[0].address)
                //.vendorField(`init for ${txType}`)
                .fee(0.1 * Math.pow(10, 8))
                .sign(delegates[0].passphrase)
                .getStruct(),
            Transactions.BuilderFactory.transfer()
                .amount(transferAmount)
                .recipientId(wallets[2].address)
                //.vendorField(`init for ${txType} - 2nd signed`)
                .fee(0.1 * Math.pow(10, 8))
                .sign(delegates[0].passphrase)
                .getStruct(),
        );
    });

    await testUtils.POST("transactions", { transactions });
};
