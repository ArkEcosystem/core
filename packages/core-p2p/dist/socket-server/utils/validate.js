"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const enums_1 = require("../../enums");
exports.validate = (schema, data) => {
    const { error: validationError } = crypto_1.Validation.validator.validate(schema, data);
    if (validationError) {
        const error = new Error(`Data validation error : ${validationError}`);
        error.name = enums_1.SocketErrors.Validation;
        throw error;
    }
};
// Specific light validation for transaction, to be used in socket workers
// to perform quick validation on transaction objects received in postTransactions
// TODO rework with v3 when refactoring p2p layer
exports.validateTransactionLight = (transaction) => {
    if (!transaction || typeof transaction !== "object") {
        return false;
    }
    // except for multipayment transactions that are capped to 128 payments currently,
    // a transaction should not have more than 100 properties total
    const maxMainProperties = 50;
    const maxAssetProperties = 100; // arbitrary, see below
    const maxMultiPayments = 128; // hardcoded as will be refactored before increasing max multipayments
    if (Object.keys(transaction).length > maxMainProperties) {
        return false;
    }
    if (transaction.asset && typeof transaction.asset === "object") {
        if (transaction.asset.payments && Array.isArray(transaction.asset.payments)) {
            if (transaction.asset.payments.length > maxMultiPayments) {
                return false;
            }
            for (const p of transaction.asset.payments) {
                if (!p || typeof p !== "object" || Object.keys(p).length !== 2 || !p.recipientId || !p.amount) {
                    return false;
                }
            }
            if (Object.keys(transaction.asset).length > 1) {
                return false; // should only contain { payments: [...] }
            }
        }
        else {
            // no "payments" asset, default to counting properties and checking vs maxProperties.
            // totally arbitrary as we could have transactions with more properties in asset,
            // but this is temporary and will be removed in v3 when p2p layer is refactored
            if (objectHasMorePropertiesThan(transaction.asset, maxAssetProperties)) {
                return false;
            }
        }
    }
    const shallowClone = { ...transaction };
    delete shallowClone.asset; // to count main properties now
    if (objectHasMorePropertiesThan(shallowClone, maxMainProperties)) {
        return false;
    }
    return true;
};
const objectHasMorePropertiesThan = (obj, maxProperties) => {
    let propertiesCount = 0;
    try {
        JSON.stringify(obj, (key, value) => {
            propertiesCount++;
            if (propertiesCount > maxProperties) {
                throw new Error("exceeded maxProperties");
            }
            return value;
        });
    }
    catch (e) {
        return true;
    }
    return false;
};
//# sourceMappingURL=validate.js.map