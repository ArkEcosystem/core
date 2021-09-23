"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const utils_1 = require("../utils");
const block_1 = require("./block");
const deserializer_1 = require("./deserializer");
class BlockFactory {
    // @TODO: add a proper type hint for data
    static make(data, keys) {
        data.generatorPublicKey = keys.publicKey;
        const payloadHash = block_1.Block.serialize(data, false);
        const hash = crypto_1.HashAlgorithms.sha256(payloadHash);
        data.blockSignature = crypto_1.Hash.signECDSA(hash, keys);
        data.id = block_1.Block.getId(data);
        return this.fromData(data);
    }
    static fromHex(hex) {
        return this.fromSerialized(hex);
    }
    static fromBytes(buffer) {
        return this.fromSerialized(buffer ? buffer.toString("hex") : undefined);
    }
    static fromJson(json) {
        // @ts-ignore
        const data = { ...json };
        data.totalAmount = utils_1.BigNumber.make(data.totalAmount);
        data.totalFee = utils_1.BigNumber.make(data.totalFee);
        data.reward = utils_1.BigNumber.make(data.reward);
        for (const transaction of data.transactions) {
            transaction.amount = utils_1.BigNumber.make(transaction.amount);
            transaction.fee = utils_1.BigNumber.make(transaction.fee);
        }
        return this.fromData(data);
    }
    static fromData(data, options = {}) {
        data = block_1.Block.applySchema(data);
        const serialized = block_1.Block.serializeWithTransactions(data).toString("hex");
        const block = new block_1.Block({ ...deserializer_1.Deserializer.deserialize(serialized, false, options), id: data.id });
        block.serialized = serialized;
        return block;
    }
    static fromSerialized(serialized) {
        const deserialized = deserializer_1.Deserializer.deserialize(serialized);
        deserialized.data = block_1.Block.applySchema(deserialized.data);
        const block = new block_1.Block(deserialized);
        block.serialized = serialized;
        return block;
    }
}
exports.BlockFactory = BlockFactory;
//# sourceMappingURL=factory.js.map