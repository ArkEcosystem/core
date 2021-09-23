import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Property } from '../property';
import { PropertyInstruction } from '../propertyInstruction';
export declare class Env extends PropertyInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    getProperties(): Property[];
}
