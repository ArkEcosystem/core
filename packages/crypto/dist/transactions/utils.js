"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const errors_1 = require("../errors");
const managers_1 = require("../managers");
const utils_1 = require("../utils");
const serializer_1 = require("./serializer");
const factory_1 = require("./types/factory");
class Utils {
    static toBytes(data) {
        return serializer_1.Serializer.serialize(factory_1.TransactionTypeFactory.create(data));
    }
    static toHash(transaction, options) {
        return crypto_1.HashAlgorithms.sha256(serializer_1.Serializer.getBytes(transaction, options));
    }
    static getId(transaction, options = {}) {
        const id = Utils.toHash(transaction, options).toString("hex");
        // WORKAROUND:
        // A handful of mainnet transactions have an invalid recipient. Due to a
        // refactor of the Address network byte validation it is no longer
        // trivially possible to handle them. If an invalid address is encountered
        // during transfer serialization, the error is bubbled up to defer the
        // `AddressNetworkByteError` until the actual id is available to call
        // `isException`.
        if (options.addressError && !utils_1.isException({ id })) {
            throw new errors_1.AddressNetworkError(options.addressError);
        }
        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = managers_1.configManager.get("exceptions");
        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }
        return id;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map