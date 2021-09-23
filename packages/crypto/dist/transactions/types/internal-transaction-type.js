"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../../enums");
class InternalTransactionType {
    constructor(type, typeGroup) {
        this.type = type;
        this.typeGroup = typeGroup;
    }
    static from(type, typeGroup) {
        if (typeGroup === undefined) {
            typeGroup = enums_1.TransactionTypeGroup.Core;
        }
        const compositeType = `${typeGroup}-${type}`;
        if (!this.types.has(compositeType)) {
            this.types.set(compositeType, new InternalTransactionType(type, typeGroup));
        }
        return this.types.get(compositeType);
    }
    toString() {
        if (this.typeGroup === enums_1.TransactionTypeGroup.Core) {
            return `Core/${this.type}`;
        }
        return `${this.typeGroup}/${this.type}`;
    }
}
exports.InternalTransactionType = InternalTransactionType;
InternalTransactionType.types = new Map();
//# sourceMappingURL=internal-transaction-type.js.map