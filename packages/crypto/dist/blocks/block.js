"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const errors_1 = require("../errors");
const config_1 = require("../managers/config");
const utils_1 = require("../utils");
const validation_1 = require("../validation");
const deserializer_1 = require("./deserializer");
const serializer_1 = require("./serializer");
class Block {
    constructor({ data, transactions, id }) {
        this.data = data;
        // TODO genesis block calculated id is wrong for some reason
        if (this.data.height === 1) {
            this.applyGenesisBlockFix(id || data.id);
        }
        // fix on real timestamp, this is overloading transaction
        // timestamp with block timestamp for storage only
        // also add sequence to keep database sequence
        this.transactions = transactions.map((transaction, index) => {
            transaction.data.blockId = this.data.id;
            transaction.timestamp = this.data.timestamp;
            transaction.data.sequence = index;
            return transaction;
        });
        delete this.data.transactions;
        this.verification = this.verify();
        // Order of transactions messed up in mainnet V1
        const { wrongTransactionOrder } = config_1.configManager.get("exceptions");
        if (wrongTransactionOrder && wrongTransactionOrder[this.data.id]) {
            const fixedOrderIds = wrongTransactionOrder[this.data.id];
            this.transactions = fixedOrderIds.map((id) => this.transactions.find(transaction => transaction.id === id));
        }
    }
    static applySchema(data) {
        let result = validation_1.validator.validate("block", data);
        if (!result.error) {
            return result.value;
        }
        result = validation_1.validator.validateException("block", data);
        for (const err of result.errors) {
            let fatal = false;
            const match = err.dataPath.match(/\.transactions\[([0-9]+)\]/);
            if (match === null) {
                if (!utils_1.isException(data)) {
                    fatal = true;
                }
            }
            else {
                const txIndex = match[1];
                const tx = data.transactions[txIndex];
                if (tx.id === undefined || !utils_1.isException(tx)) {
                    fatal = true;
                }
            }
            if (fatal) {
                throw new errors_1.BlockSchemaError(data.height, `Invalid data${err.dataPath ? " at " + err.dataPath : ""}: ` +
                    `${err.message}: ${JSON.stringify(err.data)}`);
            }
        }
        return result.value;
    }
    static deserialize(hexString, headerOnly = false) {
        return deserializer_1.Deserializer.deserialize(hexString, headerOnly).data;
    }
    static serializeWithTransactions(block) {
        return serializer_1.Serializer.serializeWithTransactions(block);
    }
    static serialize(block, includeSignature = true) {
        return serializer_1.Serializer.serialize(block, includeSignature);
    }
    static getIdHex(data) {
        const constants = config_1.configManager.getMilestone(data.height);
        const payloadHash = Block.serialize(data);
        const hash = crypto_1.HashAlgorithms.sha256(payloadHash);
        if (constants.block.idFullSha256) {
            return hash.toString("hex");
        }
        const temp = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            temp[i] = hash[7 - i];
        }
        return temp.toString("hex");
    }
    static toBytesHex(data) {
        const temp = data ? utils_1.BigNumber.make(data).toString(16) : "";
        return "0".repeat(16 - temp.length) + temp;
    }
    static getId(data) {
        const constants = config_1.configManager.getMilestone(data.height);
        const idHex = Block.getIdHex(data);
        return constants.block.idFullSha256 ? idHex : utils_1.BigNumber.make(`0x${idHex}`).toString();
    }
    getHeader() {
        const header = Object.assign({}, this.data);
        delete header.transactions;
        return header;
    }
    verifySignature() {
        const bytes = Block.serialize(this.data, false);
        const hash = crypto_1.HashAlgorithms.sha256(bytes);
        return crypto_1.Hash.verifyECDSA(hash, this.data.blockSignature, this.data.generatorPublicKey);
    }
    toJson() {
        const data = JSON.parse(JSON.stringify(this.data));
        data.reward = this.data.reward.toString();
        data.totalAmount = this.data.totalAmount.toString();
        data.totalFee = this.data.totalFee.toString();
        data.transactions = this.transactions.map(transaction => transaction.toJson());
        return data;
    }
    verify() {
        const block = this.data;
        const result = {
            verified: false,
            containsMultiSignatures: false,
            errors: [],
        };
        try {
            const constants = config_1.configManager.getMilestone(block.height);
            if (block.height !== 1) {
                if (!block.previousBlock) {
                    result.errors.push("Invalid previous block");
                }
            }
            if (!block.reward.isEqualTo(constants.reward)) {
                result.errors.push(["Invalid block reward:", block.reward, "expected:", constants.reward].join(" "));
            }
            const valid = this.verifySignature();
            if (!valid) {
                result.errors.push("Failed to verify block signature");
            }
            if (block.version !== constants.block.version) {
                result.errors.push("Invalid block version");
            }
            if (crypto_1.Slots.getSlotNumber(block.timestamp) > crypto_1.Slots.getSlotNumber()) {
                result.errors.push("Invalid block timestamp");
            }
            const serializedBuffer = Block.serializeWithTransactions({
                ...block,
                transactions: this.transactions.map(tx => tx.data),
            });
            if (serializedBuffer.byteLength > constants.block.maxPayload) {
                result.errors.push(`Payload is too large: ${serializedBuffer.byteLength} > ${constants.block.maxPayload}`);
            }
            const invalidTransactions = this.transactions.filter(tx => !tx.verified);
            if (invalidTransactions.length > 0) {
                result.errors.push("One or more transactions are not verified:");
                for (const invalidTransaction of invalidTransactions) {
                    result.errors.push(`=> ${invalidTransaction.serialized.toString("hex")}`);
                }
                result.containsMultiSignatures = invalidTransactions.some(tx => !!tx.data.signatures);
            }
            if (this.transactions.length !== block.numberOfTransactions) {
                result.errors.push("Invalid number of transactions");
            }
            if (this.transactions.length > constants.block.maxTransactions) {
                if (block.height > 1) {
                    result.errors.push("Transactions length is too high");
                }
            }
            // Checking if transactions of the block adds up to block values.
            const appliedTransactions = {};
            let totalAmount = utils_1.BigNumber.ZERO;
            let totalFee = utils_1.BigNumber.ZERO;
            const payloadBuffers = [];
            for (const transaction of this.transactions) {
                const bytes = Buffer.from(transaction.data.id, "hex");
                if (appliedTransactions[transaction.data.id]) {
                    result.errors.push(`Encountered duplicate transaction: ${transaction.data.id}`);
                }
                if (transaction.data.expiration > 0 && transaction.data.expiration <= this.data.height) {
                    const isException = config_1.configManager.get("network.name") === "devnet" && constants.ignoreExpiredTransactions;
                    if (!isException) {
                        result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                    }
                }
                if (transaction.data.version === 1 && !constants.block.acceptExpiredTransactionTimestamps) {
                    const now = block.timestamp;
                    if (transaction.data.timestamp > now + 3600 + constants.blocktime) {
                        result.errors.push(`Encountered future transaction: ${transaction.data.id}`);
                    }
                    else if (now - transaction.data.timestamp > 21600) {
                        result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                    }
                }
                appliedTransactions[transaction.data.id] = transaction.data;
                totalAmount = totalAmount.plus(transaction.data.amount);
                totalFee = totalFee.plus(transaction.data.fee);
                payloadBuffers.push(bytes);
            }
            if (!totalAmount.isEqualTo(block.totalAmount)) {
                result.errors.push("Invalid total amount");
            }
            if (!totalFee.isEqualTo(block.totalFee)) {
                result.errors.push("Invalid total fee");
            }
            if (crypto_1.HashAlgorithms.sha256(payloadBuffers).toString("hex") !== block.payloadHash) {
                result.errors.push("Invalid payload hash");
            }
        }
        catch (error) {
            result.errors.push(error);
        }
        result.verified = result.errors.length === 0;
        return result;
    }
    applyGenesisBlockFix(id) {
        this.data.id = id;
        this.data.idHex = Block.toBytesHex(id);
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map