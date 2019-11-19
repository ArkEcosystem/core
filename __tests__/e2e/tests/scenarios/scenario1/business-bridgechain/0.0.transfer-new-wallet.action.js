"use strict";

const { Managers, Utils, Transactions } = require("@arkecosystem/crypto");
const { Transactions: MagistrateTransactions } = require("@arkecosystem/core-magistrate-crypto");
const utils = require("./utils");
const { delegates } = require("../../../../lib/utils/testnet");
const testUtils = require("../../../../lib/utils/test-utils");
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessRegistrationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessUpdateTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessResignationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainRegistrationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainUpdateTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainResignationTransaction);
    
    Managers.configManager.setFromPreset("testnet");

    const senderWallet = delegates[12]; // better use a different delegate for each scenario initial transfer
    
    const transactions = [
        TransactionFactory.transfer(utils.wallets.businessRegistration.address, 10e11)
            .withFee(0.1 * 10e8)
            .withNonce(Utils.BigNumber.make(2))
            .withPassphrase(senderWallet.passphrase)
            .createOne()
    ];

    await testUtils.POST("transactions", { transactions });
};
