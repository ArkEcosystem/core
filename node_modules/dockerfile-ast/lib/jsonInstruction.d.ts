import { TextDocument, Range } from 'vscode-languageserver-types';
import { Dockerfile } from './dockerfile';
import { Argument } from './argument';
import { JSONArgument } from './jsonArgument';
import { ModifiableInstruction } from './modifiableInstruction';
export declare class JSONInstruction extends ModifiableInstruction {
    private readonly openingBracket;
    private readonly closingBracket;
    private readonly jsonStrings;
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    protected stopSearchingForFlags(_value: string): boolean;
    getOpeningBracket(): Argument | null;
    getJSONStrings(): JSONArgument[];
    getClosingBracket(): Argument | null;
}
