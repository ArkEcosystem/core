"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { Ipfs } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeIpfsType: received => {
        return {
            message: () => "Expected value to be a valid IPFS transaction.",
            pass: received.type === Ipfs,
        };
    },
});
//# sourceMappingURL=ipfs.js.map