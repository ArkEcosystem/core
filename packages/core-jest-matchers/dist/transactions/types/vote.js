"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const { Vote } = crypto_1.Enums.TransactionType;
expect.extend({
    toBeVoteType: received => {
        return {
            message: () => "Expected value to be a valid VOTE transaction.",
            pass: received.type === Vote,
        };
    },
});
//# sourceMappingURL=vote.js.map