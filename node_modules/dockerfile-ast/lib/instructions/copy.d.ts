import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Flag } from '../flag';
import { JSONInstruction } from '../jsonInstruction';
export declare class Copy extends JSONInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    stopSearchingForFlags(argument: string): boolean;
    getFromFlag(): Flag | null;
}
