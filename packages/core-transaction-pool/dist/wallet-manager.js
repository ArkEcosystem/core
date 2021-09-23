"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_state_1 = require("@arkecosystem/core-state");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
class WalletManager extends core_state_1.Wallets.WalletManager {
    constructor() {
        super();
        this.databaseService = core_container_1.app.resolvePlugin("database");
        const databaseWalletManager = this.databaseService.walletManager;
        const indexes = databaseWalletManager.getIndexNames();
        for (const index of indexes) {
            if (this.indexes[index]) {
                continue;
            }
            this.registerIndex(index, databaseWalletManager.getIndex(index).indexer);
        }
    }
    findByAddress(address) {
        if (address && !this.hasByAddress(address)) {
            this.reindex(lodash_clonedeep_1.default(this.databaseService.walletManager.findByAddress(address)));
        }
        return this.findByIndex(core_interfaces_1.State.WalletIndexes.Addresses, address);
    }
    findByIndex(index, key) {
        const wallet = super.findByIndex(index, key);
        if (wallet) {
            return wallet;
        }
        const dbWallet = this.databaseService.walletManager.findByIndex(index, key);
        if (dbWallet) {
            const cloneWallet = lodash_clonedeep_1.default(dbWallet);
            this.reindex(cloneWallet);
            return cloneWallet;
        }
        return undefined;
    }
    forget(publicKey) {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(crypto_1.Identities.Address.fromPublicKey(publicKey));
    }
    async throwIfCannotBeApplied(transaction) {
        const sender = this.findByPublicKey(transaction.data.senderPublicKey);
        const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        return handler.throwIfCannotBeApplied(transaction, sender, this.databaseService.walletManager);
    }
    async revertTransactionForSender(transaction) {
        const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        return handler.revertForSender(transaction, this);
    }
}
exports.WalletManager = WalletManager;
//# sourceMappingURL=wallet-manager.js.map