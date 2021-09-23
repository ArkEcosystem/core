"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const propertyInstruction_1 = require("../propertyInstruction");
const util_1 = require("../util");
class Label extends propertyInstruction_1.PropertyInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    getVariables() {
        const variables = super.getVariables();
        const properties = this.getProperties();
        // iterate over all of this LABEL's properties
        for (const property of properties) {
            const value = property.getUnescapedValue();
            // check if the value is contained in single quotes,
            // single quotes would indicate a literal value
            if (value !== null && value.length > 2 && value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\'') {
                const range = property.getValueRange();
                for (let i = 0; i < variables.length; i++) {
                    // if a variable is in a single quote, remove it from the list
                    if (util_1.Util.isInsideRange(variables[i].getRange().start, range)) {
                        variables.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        return variables;
    }
    getProperties() {
        return super.getProperties();
    }
}
exports.Label = Label;
