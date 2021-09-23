"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:member-ordering
const errors_1 = require("../errors");
const utils_1 = require("../utils");
const deserializer_1 = require("./deserializer");
const serializer_1 = require("./serializer");
const types_1 = require("./types");
const utils_2 = require("./utils");
const verifier_1 = require("./verifier");
class TransactionFactory {
    static fromHex(hex) {
        return this.fromSerialized(hex);
    }
    static fromBytes(buffer, strict = true) {
        return this.fromSerialized(buffer ? buffer.toString("hex") : undefined, strict);
    }
    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    static fromBytesUnsafe(buffer, id) {
        try {
            const options = { acceptLegacyVersion: true };
            const transaction = deserializer_1.Deserializer.deserialize(buffer, options);
            transaction.data.id = id || utils_2.Utils.getId(transaction.data, options);
            transaction.isVerified = true;
            return transaction;
        }
        catch (error) {
            throw new errors_1.InvalidTransactionBytesError(error.message);
        }
    }
    static fromJson(json) {
        const data = { ...json };
        data.amount = utils_1.BigNumber.make(data.amount);
        data.fee = utils_1.BigNumber.make(data.fee);
        return this.fromData(data);
    }
    static fromData(data, strict = true) {
        const { value, error } = verifier_1.Verifier.verifySchema(data, strict);
        if (error && !utils_1.isException(value)) {
            throw new errors_1.TransactionSchemaError(error);
        }
        const transaction = types_1.TransactionTypeFactory.create(value);
        const { version } = transaction.data;
        if (version === 1) {
            deserializer_1.Deserializer.applyV1Compatibility(transaction.data);
        }
        serializer_1.Serializer.serialize(transaction);
        return this.fromBytes(transaction.serialized, strict);
    }
    static fromSerialized(serialized, strict = true) {
        try {
            const transaction = deserializer_1.Deserializer.deserialize(serialized);
            transaction.data.id = utils_2.Utils.getId(transaction.data);
            const { value, error } = verifier_1.Verifier.verifySchema(transaction.data, strict);
            if (error && !utils_1.isException(value)) {
                throw new errors_1.TransactionSchemaError(error);
            }
            transaction.isVerified = transaction.verify();
            return transaction;
        }
        catch (error) {
            if (error instanceof errors_1.TransactionVersionError ||
                error instanceof errors_1.TransactionSchemaError ||
                error instanceof errors_1.DuplicateParticipantInMultiSignatureError) {
                throw error;
            }
            throw new errors_1.InvalidTransactionBytesError(error.message);
        }
    }
}
exports.TransactionFactory = TransactionFactory;
//# sourceMappingURL=factory.js.map