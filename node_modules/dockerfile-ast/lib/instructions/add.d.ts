import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { JSONInstruction } from '../jsonInstruction';
export declare class Add extends JSONInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    stopSearchingForFlags(argument: string): boolean;
}
