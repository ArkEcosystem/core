import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Variable } from '../variable';
import { Property } from '../property';
import { PropertyInstruction } from '../propertyInstruction';
export declare class Label extends PropertyInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    getVariables(): Variable[];
    getProperties(): Property[];
}
