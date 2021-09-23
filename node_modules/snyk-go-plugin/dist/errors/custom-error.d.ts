export declare class CustomError extends Error {
    innerError: any;
    code: number | undefined;
    userMessage: string | undefined;
    strCode: string | undefined;
    constructor(message: string);
}
