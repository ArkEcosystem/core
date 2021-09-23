"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modifiableInstruction_1 = require("../modifiableInstruction");
class Healthcheck extends modifiableInstruction_1.ModifiableInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    stopSearchingForFlags(argument) {
        argument = argument.toUpperCase();
        return argument === "CMD" || argument === "NONE";
    }
    getSubcommand() {
        let args = this.getArguments();
        return args.length !== 0 ? args[0] : null;
    }
}
exports.Healthcheck = Healthcheck;
