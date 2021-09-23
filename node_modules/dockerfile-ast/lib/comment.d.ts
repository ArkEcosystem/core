import { TextDocument, Range } from 'vscode-languageserver-types';
import { Line } from './line';
export declare class Comment extends Line {
    constructor(document: TextDocument, range: Range);
    toString(): string;
    /**
     * Returns the content of this comment. This excludes leading and
     * trailing whitespace as well as the # symbol. If the comment only
     * consists of whitespace, the empty string will be returned.
     */
    getContent(): string;
    /**
     * Returns a range that includes the content of the comment
     * excluding any leading and trailing whitespace as well as the #
     * symbol. May return null if the comment only consists of whitespace
     * characters.
     */
    getContentRange(): Range | null;
}
