"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const transaction_1 = require("./transaction");
class IpfsTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.IpfsTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["ipfs", "ipfs.hashes"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                if (!wallet.hasAttribute("ipfs")) {
                    wallet.setAttribute("ipfs", { hashes: {} });
                }
                const ipfsHashes = wallet.getAttribute("ipfs.hashes");
                ipfsHashes[transaction.asset.ipfs] = true;
                walletManager.reindex(wallet);
            }
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (crypto_1.Utils.isException(transaction.data)) {
            return;
        }
        if (walletManager.getIndex("ipfs").has(transaction.data.asset.ipfs)) {
            throw new errors_1.IpfsHashAlreadyExists();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }
        const ipfsHashes = sender.getAttribute("ipfs.hashes");
        ipfsHashes[transaction.data.asset.ipfs] = true;
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const ipfsHashes = sender.getAttribute("ipfs.hashes");
        delete ipfsHashes[transaction.data.asset.ipfs];
        if (!Object.keys(ipfsHashes).length) {
            sender.forgetAttribute("ipfs");
        }
        walletManager.reindex(sender);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.IpfsTransactionHandler = IpfsTransactionHandler;
//# sourceMappingURL=ipfs.js.map