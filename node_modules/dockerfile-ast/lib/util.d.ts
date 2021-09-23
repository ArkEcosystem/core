import { Range, Position } from 'vscode-languageserver-types';
export declare class Util {
    static isWhitespace(char: string): boolean;
    static isNewline(char: string): boolean;
    static findLeadingNonWhitespace(content: string, escapeChar: string): number;
    /**
     * Determines if the given position is contained within the given range.
     *
     * @param position the position to check
     * @param range the range to see if the position is inside of
     */
    static isInsideRange(position: Position, range: Range): boolean;
}
