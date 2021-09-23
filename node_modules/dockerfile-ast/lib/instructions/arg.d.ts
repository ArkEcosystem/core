import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Property } from '../property';
import { PropertyInstruction } from '../propertyInstruction';
export declare class Arg extends PropertyInstruction {
    private property;
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    /**
     * Returns the variable defined by this ARG. This may be null if
     * this ARG instruction is malformed and has no variable
     * declaration.
     */
    getProperty(): Property | null;
}
