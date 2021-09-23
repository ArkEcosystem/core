"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const xcase_1 = require("xcase");
exports.verifyData = (context, data, prevData, verifySignatures) => {
    if (context === "blocks") {
        const isBlockChained = () => {
            if (!prevData) {
                return true;
            }
            return data.height - prevData.height === 1 && data.previous_block === prevData.id;
        };
        if (!isBlockChained()) {
            core_container_1.app.resolvePlugin("logger").error(`Blocks are not chained. Current block: ${JSON.stringify(data)}, previous block: ${JSON.stringify(prevData)}`);
            return false;
        }
        // TODO: manually calculate block ID and compare to existing
        if (verifySignatures) {
            const bytes = crypto_1.Blocks.Block.serialize(xcase_1.camelizeKeys(data), false);
            const hash = crypto_1.Crypto.HashAlgorithms.sha256(bytes);
            const signatureVerify = crypto_1.Crypto.Hash.verifyECDSA(hash, data.block_signature, data.generator_public_key);
            if (!signatureVerify) {
                core_container_1.app.resolvePlugin("logger").error(`Failed to verify signature: ${JSON.stringify(data)}`);
            }
            return signatureVerify;
        }
        return true;
    }
    if (context === "transactions") {
        if (!verifySignatures) {
            return true;
        }
        return crypto_1.Transactions.TransactionFactory.fromBytes(data.serialized).verified;
    }
    if (context === "rounds") {
        return true;
    }
    return false;
};
exports.canImportRecord = (context, data, options) => {
    if (!options.lastBlock) {
        return true;
    }
    if (context === "blocks") {
        return data.height > options.lastBlock.height;
    }
    if (context === "transactions") {
        return data.timestamp > options.lastBlock.timestamp;
    }
    if (context === "rounds") {
        if (options.lastRound === null) {
            return true;
        }
        const dataRound = Number(data.round);
        const lastRound = Number(options.lastRound.round);
        if (dataRound > lastRound) {
            return true;
        }
        if (dataRound < lastRound) {
            return false;
        }
        const dataBalance = crypto_1.Utils.BigNumber.make(data.balance);
        const lastBalance = crypto_1.Utils.BigNumber.make(options.lastRound.balance);
        if (dataBalance.isLessThan(lastBalance)) {
            return true;
        }
        if (dataBalance.isGreaterThan(lastBalance)) {
            return false;
        }
        if (data.public_key > options.lastRound.publicKey) {
            return true;
        }
        return false;
    }
    return false;
};
//# sourceMappingURL=verification.js.map