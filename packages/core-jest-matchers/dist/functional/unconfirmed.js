"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
expect.extend({
    toBeUnconfirmed: async (transaction) => {
        let pass = false;
        let error;
        try {
            const { body } = await got_1.default.get(`http://localhost:4003/api/v2/transactions/unconfirmed`);
            const parsedBody = JSON.parse(body);
            pass = !!parsedBody.data.find(tx => tx.id === transaction.id);
            error = JSON.stringify(parsedBody.errors);
        }
        catch (e) {
            error = e.message;
            console.error(error);
        }
        return {
            pass,
            message: () => `expected ${transaction.id} ${this.isNot ? "not" : ""} to be unconfirmed (in the pool) ${error ? "(error: " + error + ")" : ""}`,
        };
    },
});
//# sourceMappingURL=unconfirmed.js.map