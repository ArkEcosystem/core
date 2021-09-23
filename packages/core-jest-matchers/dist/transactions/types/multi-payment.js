"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { MultiPayment } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeMultiPaymentType: received => {
        return {
            message: () => "Expected value to be a valid MultiPayment transaction.",
            pass: received.type === MultiPayment,
        };
    },
});
//# sourceMappingURL=multi-payment.js.map