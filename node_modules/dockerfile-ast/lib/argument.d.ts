import { Range, Position } from 'vscode-languageserver-types';
export declare class Argument {
    private readonly value;
    private readonly range;
    constructor(value: string, range: Range);
    toString(): string;
    getRange(): Range;
    getValue(): string;
    isAfter(position: Position): boolean;
    isBefore(position: Position): boolean;
}
