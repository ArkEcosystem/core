/**
 * @export
 * @class Exception
 * @extends {Error}
 */
export class Exception extends Error {
    /**
     * Creates an instance of Exception.
     *
     * @param {string} message
     * @param {string} [code]
     * @memberof Exception
     */
    constructor(message: string, code?: string) {
        super(message);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: code ? `${code}: ${message}` : message,
        });

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        Error.captureStackTrace(this, this.constructor);
    }
}
