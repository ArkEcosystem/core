import { TextDocument, Range } from 'vscode-languageserver-types';
export declare class Line {
    protected readonly document: TextDocument;
    private readonly range;
    constructor(document: TextDocument, range: Range);
    getRange(): Range;
    getTextContent(): string;
    isAfter(line: Line): boolean;
    isBefore(line: number): boolean;
}
