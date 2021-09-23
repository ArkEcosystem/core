"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
exports.satoshiFlag = command_1.flags.build({
    parse: input => {
        const value = Number(input);
        if (value < 1 / 1e8) {
            throw new Error(`Expected number greater than 1 satoshi.`);
        }
        return value;
    },
});
//# sourceMappingURL=flags.js.map