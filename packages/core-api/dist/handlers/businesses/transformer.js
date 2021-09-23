"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transformer_1 = require("../wallets/transformer");
exports.transformBusiness = (business) => {
    if (business.name === undefined) {
        return transformer_1.transformWallet(business);
    }
    return business;
};
//# sourceMappingURL=transformer.js.map