"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const property_1 = require("../property");
const propertyInstruction_1 = require("../propertyInstruction");
class Arg extends propertyInstruction_1.PropertyInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
        this.property = null;
        const args = this.getPropertyArguments();
        if (args.length === 1) {
            this.property = new property_1.Property(this.document, this.escapeChar, args[0]);
        }
        else {
            this.property = null;
        }
    }
    /**
     * Returns the variable defined by this ARG. This may be null if
     * this ARG instruction is malformed and has no variable
     * declaration.
     */
    getProperty() {
        return this.property;
    }
}
exports.Arg = Arg;
