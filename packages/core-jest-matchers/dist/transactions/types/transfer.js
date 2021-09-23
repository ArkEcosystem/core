"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { Transfer } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeTransferType: received => {
        return {
            message: () => "Expected value to be a valid Transfer transaction.",
            pass: received.type === Transfer,
        };
    },
});
//# sourceMappingURL=transfer.js.map