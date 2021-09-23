import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Instruction } from '../instruction';
export declare class Onbuild extends Instruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    getTrigger(): string | null;
    getTriggerWord(): string | null;
    getTriggerRange(): Range | null;
    getTriggerInstruction(): Instruction | null;
}
