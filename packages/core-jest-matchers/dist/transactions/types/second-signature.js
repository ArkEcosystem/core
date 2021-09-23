"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { SecondSignature } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeSecondSignatureType: received => {
        return {
            message: () => "Expected value to be a valid SecondSignature transaction.",
            pass: received.type === SecondSignature,
        };
    },
});
//# sourceMappingURL=second-signature.js.map