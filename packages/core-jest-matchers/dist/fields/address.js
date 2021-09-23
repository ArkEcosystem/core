"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
expect.extend({
    toBeAddress: (received, argument) => {
        return {
            message: () => "Expected value to be a valid address",
            pass: crypto_1.Identities.Address.validate(received, argument),
        };
    },
});
//# sourceMappingURL=address.js.map