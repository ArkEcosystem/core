"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const constants_1 = require("../constants");
const config_1 = require("../managers/config");
const base58_1 = require("./base58");
exports.Base58 = base58_1.Base58;
const bignum_1 = require("./bignum");
exports.BigNumber = bignum_1.BigNumber;
const is_valid_peer_1 = require("./is-valid-peer");
exports.isLocalHost = is_valid_peer_1.isLocalHost;
exports.isValidPeer = is_valid_peer_1.isValidPeer;
const getExceptionIds = fast_memoize_1.default(_ => {
    const s = new Set();
    const blockIds = config_1.configManager.get("exceptions.blocks") || [];
    const transactionIds = config_1.configManager.get("exceptions.transactions") || [];
    for (const blockId of blockIds) {
        s.add(blockId);
    }
    for (const transactionId of transactionIds) {
        s.add(transactionId);
    }
    return s;
});
const getGenesisTransactionIds = fast_memoize_1.default(_ => {
    const s = new Set();
    const genesisTransactions = config_1.configManager.get("genesisBlock.transactions") || [];
    for (const transaction of genesisTransactions) {
        s.add(transaction.id);
    }
    return s;
});
/**
 * Get human readable string from satoshis
 */
exports.formatSatoshi = (amount) => {
    const localeString = (+amount / constants_1.SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });
    return `${localeString} ${config_1.configManager.get("network.client.symbol")}`;
};
/**
 * Check if the given block or transaction id is an exception.
 */
exports.isException = (blockOrTransaction) => {
    const network = config_1.configManager.get("network");
    if (typeof blockOrTransaction.id !== "string") {
        return false;
    }
    if (blockOrTransaction.id.length < 64) {
        // old block ids, we check that the transactions inside the block are correct
        const blockExceptionTxIds = (config_1.configManager.get("exceptions.blocksTransactions") || {})[blockOrTransaction.id];
        const blockTransactions = blockOrTransaction.transactions || [];
        if (!blockExceptionTxIds || blockExceptionTxIds.length !== blockTransactions.length) {
            return false;
        }
        blockExceptionTxIds.sort();
        const blockToCheckTxIds = blockTransactions.map(tx => tx.id).sort();
        for (let i = 0; i < blockExceptionTxIds.length; i++) {
            if (blockToCheckTxIds[i] !== blockExceptionTxIds[i]) {
                return false;
            }
        }
    }
    return getExceptionIds(network).has(blockOrTransaction.id);
};
exports.isGenesisTransaction = (id) => {
    const network = config_1.configManager.get("network");
    return getGenesisTransactionIds(network).has(id);
};
exports.numberToHex = (num, padding = 2) => {
    const indexHex = Number(num).toString(16);
    return "0".repeat(padding - indexHex.length) + indexHex;
};
exports.maxVendorFieldLength = (height) => config_1.configManager.getMilestone(height).vendorFieldLength;
exports.isSupportedTransactionVersion = (version) => {
    const aip11 = config_1.configManager.getMilestone().aip11;
    if (aip11 && version !== 2) {
        return false;
    }
    if (!aip11 && version !== 1) {
        return false;
    }
    return true;
};
//# sourceMappingURL=index.js.map