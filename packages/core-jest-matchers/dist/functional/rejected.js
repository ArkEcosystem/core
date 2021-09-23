"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
expect.extend({
    toBeRejected: async (transaction) => {
        let pass = true;
        let response;
        try {
            const { body } = await got_1.default.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions: [transaction] }),
            });
            response = body;
            const parsedBody = JSON.parse(body);
            pass = parsedBody.errors !== undefined && parsedBody.data.invalid.includes(transaction.id);
        }
        catch (e) { } // tslint:disable-line
        return {
            pass,
            message: () => `expected ${transaction.id} ${this.isNot ? "not" : ""} to be rejected, but: ${response}`,
        };
    },
    toBeEachRejected: async (transactions) => {
        let pass = true;
        let response;
        try {
            for (const transaction of transactions) {
                const { body } = await got_1.default.post(`http://localhost:4003/api/v2/transactions`, {
                    body: JSON.stringify({ transactions: [transaction] }),
                });
                response = body;
                const parsedBody = JSON.parse(body);
                pass = parsedBody.errors !== undefined && parsedBody.data.invalid.includes(transaction.id);
                if (!pass) {
                    break;
                }
            }
        }
        catch (e) { } // tslint:disable-line
        return {
            pass,
            message: () => `expected transactions ${this.isNot ? "not" : ""} to be rejected, but: ${response}`,
        };
    },
});
//# sourceMappingURL=rejected.js.map