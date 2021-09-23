"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WalletIndex {
    constructor(indexer) {
        this.indexer = indexer;
        this.walletIndex = {};
    }
    entries() {
        return Object.entries(this.walletIndex);
    }
    keys() {
        return Object.keys(this.walletIndex);
    }
    values() {
        return Object.values(this.walletIndex);
    }
    index(wallet) {
        this.indexer(this, wallet);
    }
    has(key) {
        return !!this.walletIndex[key];
    }
    get(key) {
        return this.walletIndex[key];
    }
    set(key, wallet) {
        this.walletIndex[key] = wallet;
    }
    forget(key) {
        delete this.walletIndex[key];
    }
    clear() {
        this.walletIndex = {};
    }
}
exports.WalletIndex = WalletIndex;
//# sourceMappingURL=wallet-index.js.map