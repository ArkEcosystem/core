import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from './dockerfile';
import { Argument } from './argument';
import { Flag } from './flag';
import { Instruction } from './instruction';
export declare abstract class ModifiableInstruction extends Instruction {
    private flags;
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    protected abstract stopSearchingForFlags(value: string): boolean;
    getFlags(): Flag[];
    getArguments(): Argument[];
}
