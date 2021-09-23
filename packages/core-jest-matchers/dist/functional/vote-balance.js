"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
expect.extend({
    toHaveVoteBalance: async (publicKey, voteBalance) => {
        let pass = false;
        let fetchedVoteBalance;
        try {
            const { body } = await got_1.default.get(`http://localhost:4003/api/v2/delegates/${publicKey}`);
            const parsedBody = JSON.parse(body);
            fetchedVoteBalance = parsedBody.data.votes;
            pass = fetchedVoteBalance === voteBalance;
        }
        catch (e) { } // tslint:disable-line
        return {
            pass,
            message: () => `expected delegate ${publicKey} ${this.isNot ? "not" : ""} to have vote balance = ${voteBalance}, got ${fetchedVoteBalance}`,
        };
    },
});
//# sourceMappingURL=vote-balance.js.map