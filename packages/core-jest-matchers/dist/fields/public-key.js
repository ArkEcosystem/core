"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
expect.extend({
    toBePublicKey: received => {
        return {
            message: () => "Expected value to be a valid public key",
            pass: crypto_1.Identities.PublicKey.validate(received),
        };
    },
});
//# sourceMappingURL=public-key.js.map