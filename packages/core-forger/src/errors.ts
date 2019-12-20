/**
 * @export
 * @class ForgerError
 * @extends {Error}
 */
export class ForgerError extends Error {
    public constructor(message: string) {
        super(message);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message,
        });

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @export
 * @class RelayCommunicationError
 * @extends {ForgerError}
 */
export class RelayCommunicationError extends ForgerError {
    public constructor(endpoint: string, message: string) {
        super(`Request to ${endpoint} failed, because of '${message}'.`);
    }
}

/**
 * @export
 * @class HostNoResponseError
 * @extends {ForgerError}
 */
export class HostNoResponseError extends ForgerError {
    public constructor(host: string) {
        super(`${host} didn't respond. Trying again later.`);
    }
}
