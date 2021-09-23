"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const errors_1 = require("../errors");
const events_1 = require("../events");
const business_registration_1 = require("./business-registration");
const magistrate_handler_1 = require("./magistrate-handler");
class BusinessUpdateTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BusinessUpdateTransaction;
    }
    dependencies() {
        return [business_registration_1.BusinessRegistrationTransactionHandler];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const reader = await core_transactions_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const businessWalletAsset = wallet.getAttribute("business").businessAsset;
                const businessUpdate = transaction.asset
                    .businessUpdate;
                wallet.setAttribute("business.businessAsset", {
                    ...businessWalletAsset,
                    ...businessUpdate,
                });
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (!wallet.hasAttribute("business")) {
            throw new errors_1.BusinessIsNotRegisteredError();
        }
        if (wallet.getAttribute("business").resigned) {
            throw new errors_1.BusinessIsResignedError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        if (await pool.senderHasTransactionsOfType(data.senderPublicKey, core_magistrate_crypto_1.Enums.MagistrateTransactionType.BusinessUpdate, core_magistrate_crypto_1.Enums.MagistrateTransactionGroup)) {
            const wallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            return {
                type: "ERR_PENDING",
                message: `Business update for "${wallet.getAttribute("business")}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset = sender.getAttribute("business").businessAsset;
        const businessUpdate = transaction.data.asset.businessUpdate;
        sender.setAttribute("business.businessAsset", {
            ...businessWalletAsset,
            ...businessUpdate,
        });
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        // Here we have to "replay" all business registration and update transactions
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const connection = core_container_1.app.resolvePlugin("database").connection;
        const dbRegistrationTransactions = await connection.transactionsRepository.search({
            parameters: [
                {
                    field: "senderPublicKey",
                    value: transaction.data.senderPublicKey,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
                {
                    field: "type",
                    value: core_magistrate_crypto_1.Enums.MagistrateTransactionType.BusinessRegistration,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
                {
                    field: "typeGroup",
                    value: transaction.data.typeGroup,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
            ],
        });
        const dbUpdateTransactions = await connection.transactionsRepository.search({
            parameters: [
                {
                    field: "senderPublicKey",
                    value: transaction.data.senderPublicKey,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
                {
                    field: "type",
                    value: core_magistrate_crypto_1.Enums.MagistrateTransactionType.BusinessUpdate,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
                {
                    field: "typeGroup",
                    value: transaction.data.typeGroup,
                    operator: core_interfaces_1.Database.SearchOperator.OP_EQ,
                },
            ],
            orderBy: [
                {
                    direction: "asc",
                    field: "nonce",
                },
            ],
        });
        const businessWalletAsset = dbRegistrationTransactions.rows[0].asset
            .businessRegistration;
        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            if (dbUpdateTx.id === transaction.id) {
                continue;
            }
            Object.assign(businessWalletAsset, dbUpdateTx.asset
                .businessUpdate);
        }
        sender.setAttribute("business.businessAsset", businessWalletAsset);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BusinessUpdateTransactionHandler = BusinessUpdateTransactionHandler;
//# sourceMappingURL=business-update.js.map