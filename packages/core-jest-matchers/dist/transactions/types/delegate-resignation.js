"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { DelegateResignation } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeDelegateResignationType: received => {
        return {
            message: () => "Expected value to be a valid DelegateResignation transaction.",
            pass: received.type === DelegateResignation,
        };
    },
});
//# sourceMappingURL=delegate-resignation.js.map