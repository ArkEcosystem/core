"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const parser_1 = require("../parser");
const instruction_1 = require("../instruction");
class Onbuild extends instruction_1.Instruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    getTrigger() {
        let trigger = this.getTriggerWord();
        return trigger === null ? null : trigger.toUpperCase();
    }
    getTriggerWord() {
        return this.getRangeContent(this.getTriggerRange());
    }
    getTriggerRange() {
        let args = this.getArguments();
        return args.length > 0 ? args[0].getRange() : null;
    }
    getTriggerInstruction() {
        let triggerRange = this.getTriggerRange();
        if (triggerRange === null) {
            return null;
        }
        let args = this.getArguments();
        return parser_1.Parser.createInstruction(this.document, this.dockerfile, this.escapeChar, vscode_languageserver_types_1.Range.create(args[0].getRange().start, this.getRange().end), this.getTriggerWord(), triggerRange);
    }
}
exports.Onbuild = Onbuild;
