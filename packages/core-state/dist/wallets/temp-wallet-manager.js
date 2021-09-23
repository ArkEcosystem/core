"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const wallet_1 = require("./wallet");
const wallet_manager_1 = require("./wallet-manager");
class TempWalletManager extends wallet_manager_1.WalletManager {
    constructor(walletManager) {
        super();
        this.walletManager = walletManager;
        this.index(this.walletManager.allByUsername());
        for (const index of walletManager.getIndexNames()) {
            if (this.indexes[index]) {
                continue;
            }
            this.indexes[index] = lodash_clonedeep_1.default(walletManager.getIndex(index));
        }
    }
    reindex(wallet) {
        super.reindex(lodash_clonedeep_1.default(wallet));
    }
    findByAddress(address) {
        return this.findByIndex(core_interfaces_1.State.WalletIndexes.Addresses, address);
    }
    findByUsername(username) {
        return this.findByIndex(core_interfaces_1.State.WalletIndexes.Usernames, username);
    }
    findByIndex(indexName, key) {
        const index = this.getIndex(indexName);
        if (!index.has(key)) {
            const parentIndex = this.walletManager.getIndex(indexName);
            if (parentIndex.has(key)) {
                index.set(key, lodash_clonedeep_1.default(parentIndex.get(key)));
            }
            else if (indexName === core_interfaces_1.State.WalletIndexes.Addresses) {
                const wallet = new wallet_1.Wallet(key);
                index.set(key, wallet);
            }
        }
        return index.get(key);
    }
    hasByAddress(address) {
        return this.walletManager.hasByAddress(address);
    }
    hasByPublicKey(publicKey) {
        return this.walletManager.hasByPublicKey(publicKey);
    }
    hasByUsername(username) {
        return this.walletManager.hasByUsername(username);
    }
}
exports.TempWalletManager = TempWalletManager;
//# sourceMappingURL=temp-wallet-manager.js.map