"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
expect.extend({
    toBeValidTransaction: actual => {
        let verified = false;
        try {
            verified = crypto_1.Transactions.Verifier.verifyHash(actual);
        }
        catch (e) { } // tslint:disable-line
        return {
            message: () => "Expected value to be a valid transaction",
            pass: !!verified,
        };
    },
});
//# sourceMappingURL=valid.js.map