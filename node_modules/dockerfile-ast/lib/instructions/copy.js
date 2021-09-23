"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonInstruction_1 = require("../jsonInstruction");
class Copy extends jsonInstruction_1.JSONInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    stopSearchingForFlags(argument) {
        return argument.indexOf("--") === -1;
    }
    getFromFlag() {
        let flags = super.getFlags();
        return flags.length === 1 && flags[0].getName() === "from" ? flags[0] : null;
    }
}
exports.Copy = Copy;
