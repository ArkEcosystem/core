"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { MultiSignature } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeMultiSignatureType: received => {
        return {
            message: () => "Expected value to be a valid MultiSignature transaction.",
            pass: received.type === MultiSignature,
        };
    },
});
//# sourceMappingURL=multi-signature.js.map