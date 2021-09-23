"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
expect.extend({
    toBeForged: async (id) => {
        let pass = false;
        try {
            const { body } = await got_1.default.get(`http://localhost:4003/api/v2/transactions/${id}`);
            const parsedBody = JSON.parse(body);
            pass = parsedBody.data.id === id;
        }
        catch (e) { } // tslint:disable-line
        return {
            pass,
            message: () => `expected ${id} ${this.isNot ? "not" : ""} to be forged`,
        };
    },
});
//# sourceMappingURL=forged.js.map