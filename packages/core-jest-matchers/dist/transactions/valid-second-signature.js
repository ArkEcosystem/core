"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
expect.extend({
    toHaveValidSecondSignature: (actual, expected) => {
        let verified;
        try {
            verified = crypto_1.Transactions.Verifier.verifySecondSignature(actual, expected.publicKey);
        }
        catch (e) {
        } // tslint:disable-line
        return {
            message: () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
//# sourceMappingURL=valid-second-signature.js.map