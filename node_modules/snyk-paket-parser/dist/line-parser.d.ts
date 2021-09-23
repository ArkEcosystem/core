export declare class Line {
    data: string;
    indentation: number;
    constructor(data: string, indentation: number);
}
export declare function parseLines(input: string, indent?: string, lineSeparator?: RegExp): Line[];
