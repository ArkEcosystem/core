"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
exports.transformRoundDelegate = model => {
    return {
        publicKey: model.publicKey,
        votes: crypto_1.Utils.BigNumber.make(model.balance).toFixed(),
    };
};
//# sourceMappingURL=transformer.js.map