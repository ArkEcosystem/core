import { Range, Position } from 'vscode-languageserver-types';
import * as ast from './main';
import { Comment } from './comment';
import { Instruction } from './instruction';
import { Arg } from './instructions/arg';
import { Cmd } from './instructions/cmd';
import { Copy } from './instructions/copy';
import { Env } from './instructions/env';
import { Entrypoint } from './instructions/entrypoint';
import { From } from './instructions/from';
import { Healthcheck } from './instructions/healthcheck';
export declare class ImageTemplate implements ast.ImageTemplate {
    private readonly comments;
    private readonly instructions;
    addComment(comment: Comment): void;
    getComments(): Comment[];
    addInstruction(instruction: Instruction): void;
    getInstructions(): Instruction[];
    protected getInstructionAt(line: number): Instruction | null;
    /**
     * Gets all the ARG instructions that are defined in this image.
     */
    getARGs(): Arg[];
    /**
     * Gets all the CMD instructions that are defined in this image.
     */
    getCMDs(): Cmd[];
    /**
     * Gets all the COPY instructions that are defined in this image.
     */
    getCOPYs(): Copy[];
    /**
     * Gets all the ENTRYPOINT instructions that are defined in this image.
     */
    getENTRYPOINTs(): Entrypoint[];
    /**
     * Gets all the ENV instructions that are defined in this image.
     */
    getENVs(): Env[];
    /**
     * Gets all the FROM instructions that are defined in this image.
     */
    getFROMs(): From[];
    /**
     * Gets all the HEALTHCHECK instructions that are defined in this image.
     */
    getHEALTHCHECKs(): Healthcheck[];
    getOnbuildTriggers(): Instruction[];
    getAvailableVariables(currentLine: number): string[];
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
    resolveVariable(variable: string, line: number): string | null | undefined;
    getRange(): Range | null;
    contains(position: Position): boolean;
}
