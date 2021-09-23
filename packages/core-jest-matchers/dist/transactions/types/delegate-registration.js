"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { DelegateRegistration } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeDelegateRegistrationType: received => {
        return {
            message: () => "Expected value to be a valid DELEGATE transaction.",
            pass: received.type === DelegateRegistration,
        };
    },
});
//# sourceMappingURL=delegate-registration.js.map