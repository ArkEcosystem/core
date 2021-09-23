/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const arg_1 = require("./instructions/arg");
const cmd_1 = require("./instructions/cmd");
const copy_1 = require("./instructions/copy");
const env_1 = require("./instructions/env");
const entrypoint_1 = require("./instructions/entrypoint");
const from_1 = require("./instructions/from");
const healthcheck_1 = require("./instructions/healthcheck");
const onbuild_1 = require("./instructions/onbuild");
const util_1 = require("./util");
class ImageTemplate {
    constructor() {
        this.comments = [];
        this.instructions = [];
    }
    addComment(comment) {
        this.comments.push(comment);
    }
    getComments() {
        return this.comments;
    }
    addInstruction(instruction) {
        this.instructions.push(instruction);
    }
    getInstructions() {
        return this.instructions;
    }
    getInstructionAt(line) {
        for (let instruction of this.instructions) {
            if (util_1.Util.isInsideRange(vscode_languageserver_types_1.Position.create(line, 0), instruction.getRange())) {
                return instruction;
            }
        }
        return null;
    }
    /**
     * Gets all the ARG instructions that are defined in this image.
     */
    getARGs() {
        let args = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof arg_1.Arg) {
                args.push(instruction);
            }
        }
        return args;
    }
    /**
     * Gets all the CMD instructions that are defined in this image.
     */
    getCMDs() {
        let cmds = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof cmd_1.Cmd) {
                cmds.push(instruction);
            }
        }
        return cmds;
    }
    /**
     * Gets all the COPY instructions that are defined in this image.
     */
    getCOPYs() {
        let copies = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof copy_1.Copy) {
                copies.push(instruction);
            }
        }
        return copies;
    }
    /**
     * Gets all the ENTRYPOINT instructions that are defined in this image.
     */
    getENTRYPOINTs() {
        let froms = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof entrypoint_1.Entrypoint) {
                froms.push(instruction);
            }
        }
        return froms;
    }
    /**
     * Gets all the ENV instructions that are defined in this image.
     */
    getENVs() {
        let args = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof env_1.Env) {
                args.push(instruction);
            }
        }
        return args;
    }
    /**
     * Gets all the FROM instructions that are defined in this image.
     */
    getFROMs() {
        let froms = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof from_1.From) {
                froms.push(instruction);
            }
        }
        return froms;
    }
    /**
     * Gets all the HEALTHCHECK instructions that are defined in this image.
     */
    getHEALTHCHECKs() {
        let froms = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof healthcheck_1.Healthcheck) {
                froms.push(instruction);
            }
        }
        return froms;
    }
    getOnbuildTriggers() {
        let triggers = [];
        for (let instruction of this.instructions) {
            if (instruction instanceof onbuild_1.Onbuild) {
                let trigger = instruction.getTriggerInstruction();
                if (trigger) {
                    triggers.push(trigger);
                }
            }
        }
        return triggers;
    }
    getAvailableVariables(currentLine) {
        const variables = [];
        for (const arg of this.getARGs()) {
            if (arg.isBefore(currentLine)) {
                const property = arg.getProperty();
                if (property) {
                    const variable = property.getName();
                    if (variables.indexOf(variable) === -1) {
                        variables.push(variable);
                    }
                }
            }
        }
        for (const env of this.getENVs()) {
            if (env.isBefore(currentLine)) {
                for (const property of env.getProperties()) {
                    const variable = property.getName();
                    if (variables.indexOf(variable) === -1) {
                        variables.push(variable);
                    }
                }
            }
        }
        return variables;
    }
    /**
     * Resolves a variable with the given name at the specified line
     * to its value. If null is returned, then the variable has been
     * defined but no value was given. If undefined is returned, then
     * a variable with the given name has not been defined yet as of
     * the given line.
     *
     * @param variable the name of the variable to resolve
     * @param line the line number that the variable is on, zero-based
     * @return the value of the variable as defined by an ARG or ENV
     *         instruction, or null if no value has been specified, or
     *         undefined if a variable with the given name has not
     *         been defined
     */
    resolveVariable(variable, line) {
        let envs = this.getENVs();
        for (let i = envs.length - 1; i >= 0; i--) {
            if (envs[i].isBefore(line)) {
                for (let property of envs[i].getProperties()) {
                    if (property.getName() === variable) {
                        return property.getValue();
                    }
                }
            }
        }
        let args = this.getARGs();
        for (let i = args.length - 1; i >= 0; i--) {
            if (args[i].isBefore(line)) {
                let property = args[i].getProperty();
                if (property && property.getName() === variable) {
                    return property.getValue();
                }
            }
        }
        return undefined;
    }
    getRange() {
        const instructions = this.getInstructions();
        if (instructions.length === 0) {
            // all templates should have instructions, this only happens for
            // the initial set of instruction
            return vscode_languageserver_types_1.Range.create(0, 0, 0, 0);
        }
        const instructionStart = instructions[0].getRange().start;
        const instructionEnd = instructions[instructions.length - 1].getRange().end;
        return vscode_languageserver_types_1.Range.create(instructionStart, instructionEnd);
    }
    contains(position) {
        const range = this.getRange();
        if (range === null) {
            return false;
        }
        return util_1.Util.isInsideRange(position, range);
    }
}
exports.ImageTemplate = ImageTemplate;
