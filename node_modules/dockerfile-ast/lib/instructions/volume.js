"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonInstruction_1 = require("../jsonInstruction");
class Volume extends jsonInstruction_1.JSONInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
}
exports.Volume = Volume;
