"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
expect.extend({
    toBeAccepted: async (transaction) => {
        let pass = false;
        let error;
        try {
            const { body } = await got_1.default.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions: [transaction] }),
            });
            const parsedBody = JSON.parse(body);
            pass =
                parsedBody.errors === undefined &&
                    parsedBody.data.accept.includes(transaction.id) &&
                    parsedBody.data.broadcast.includes(transaction.id);
            error = JSON.stringify(parsedBody.errors);
        }
        catch (e) {
            error = e.message;
            console.error(error);
        }
        return {
            pass,
            message: () => `expected ${transaction.id} ${this.isNot ? "not" : ""} to be accepted ${error ? "(error: " + error + ")" : ""}`,
        };
    },
    toBeAllAccepted: async (transactions) => {
        let pass = false;
        let error;
        try {
            const { body } = await got_1.default.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions }),
            });
            const parsedBody = JSON.parse(body);
            pass = parsedBody.errors === undefined;
            error = JSON.stringify(parsedBody.errors);
        }
        catch (e) {
            error = e.message;
            console.error(error);
        }
        return {
            pass,
            message: () => `expected all transactions ${this.isNot ? "not" : ""} to be accepted ${error ? "(error: " + error + ")" : ""}`,
        };
    },
    toBeEachAccepted: async (transactions) => {
        let pass = true;
        let error;
        try {
            for (const tx of transactions) {
                const { body } = await got_1.default.post(`http://localhost:4003/api/v2/transactions`, {
                    body: JSON.stringify({ transactions: [tx] }),
                });
                const parsedBody = JSON.parse(body);
                if (parsedBody.errors) {
                    error += JSON.stringify(parsedBody.errors);
                    pass = false;
                }
            }
        }
        catch (e) {
            pass = false;
            error = e.message;
            console.error(error);
        }
        return {
            pass,
            message: () => `expected transactions ${this.isNot ? "not" : ""} to be accepted ${error ? "(error: " + error + ")" : ""}`,
        };
    },
});
//# sourceMappingURL=accepted.js.map