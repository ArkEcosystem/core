"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const errors_1 = require("../errors");
const events_1 = require("../events");
const bridgechain_registration_1 = require("./bridgechain-registration");
const magistrate_handler_1 = require("./magistrate-handler");
const utils_1 = require("./utils");
class BridgechainUpdateTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BridgechainUpdateTransaction;
    }
    dependencies() {
        return [bridgechain_registration_1.BridgechainRegistrationTransactionHandler];
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
                const businessAttributes = wallet.getAttribute("business");
                const bridgechainUpdate = transaction.asset.bridgechainUpdate;
                const bridgechainAsset = businessAttributes.bridgechains[bridgechainUpdate.bridgechainId].bridgechainAsset;
                const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
                delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
                Object.assign(bridgechainAsset, shallowCloneBridgechainUpdate);
                walletManager.reindex(wallet);
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (!wallet.hasAttribute("business")) {
            throw new errors_1.BusinessIsNotRegisteredError();
        }
        if (wallet.getAttribute("business.resigned") === true) {
            throw new errors_1.BusinessIsResignedError();
        }
        const businessAttributes = wallet.getAttribute("business");
        if (!businessAttributes.bridgechains) {
            throw new errors_1.BridgechainIsNotRegisteredByWalletError();
        }
        const bridgechainUpdate = transaction.data.asset.bridgechainUpdate;
        const bridgechainAttributes = businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];
        if (!bridgechainAttributes) {
            throw new errors_1.BridgechainIsNotRegisteredByWalletError();
        }
        if (bridgechainAttributes.resigned) {
            throw new errors_1.BridgechainIsResignedError();
        }
        for (const portKey of Object.keys(bridgechainUpdate.ports || {})) {
            if (!utils_1.packageNameRegex.test(portKey)) {
                throw new errors_1.PortKeyMustBeValidPackageNameError();
            }
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        const { bridgechainId } = data.asset.bridgechainUpdate;
        const bridgechainUpdatesInPool = Array.from(await pool.getTransactionsByType(core_magistrate_crypto_1.Enums.MagistrateTransactionType.BridgechainUpdate, core_magistrate_crypto_1.Enums.MagistrateTransactionGroup)).map((memTx) => memTx.data);
        if (bridgechainUpdatesInPool.some(update => update.senderPublicKey === data.senderPublicKey &&
            update.asset.bridgechainUpdate.bridgechainId === bridgechainId)) {
            return {
                type: "ERR_PENDING",
                message: `Bridgechain update for bridgechainId "${bridgechainId}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = wallet.getAttribute("business");
        const bridgechainUpdate = transaction.data.asset.bridgechainUpdate;
        const bridgechainAttributes = businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];
        const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
        delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
        Object.assign(bridgechainAttributes.bridgechainAsset, shallowCloneBridgechainUpdate);
        walletManager.reindex(wallet);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        // Here we have to "replay" all bridgechain registration and update transactions for this bridgechain id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = sender.getAttribute("business");
        const bridgechainId = transaction.data.asset.bridgechainUpdate.bridgechainId;
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
                    value: core_magistrate_crypto_1.Enums.MagistrateTransactionType.BridgechainRegistration,
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
                    value: core_magistrate_crypto_1.Enums.MagistrateTransactionType.BridgechainUpdate,
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
        let bridgechainAsset;
        for (const dbRegistrationTx of dbRegistrationTransactions.rows) {
            if (dbRegistrationTx.asset.bridgechainRegistration.genesisHash === bridgechainId) {
                bridgechainAsset = dbRegistrationTx.asset
                    .bridgechainRegistration;
                break;
            }
        }
        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            const bridgechainUpdateAsset = dbUpdateTx.asset
                .bridgechainUpdate;
            if (dbUpdateTx.id === transaction.id || bridgechainUpdateAsset.bridgechainId !== bridgechainId) {
                continue;
            }
            delete dbUpdateTx.asset.bridgechainUpdate.bridgechainId; // no need for bridgechainId for bridgechain asset
            Object.assign(bridgechainAsset, bridgechainUpdateAsset);
        }
        businessAttributes.bridgechains[bridgechainId] = { bridgechainAsset };
        walletManager.reindex(sender);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BridgechainUpdateTransactionHandler = BridgechainUpdateTransactionHandler;
//# sourceMappingURL=bridgechain-update.js.map