import { Range } from 'vscode-languageserver-types';
import { Argument } from './argument';
export declare class JSONArgument extends Argument {
    private readonly jsonRange;
    constructor(value: string, range: Range, jsonRange: Range);
    getJSONRange(): Range;
    getJSONValue(): string;
}
