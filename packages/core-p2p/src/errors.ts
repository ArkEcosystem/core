// tslint:disable:max-classes-per-file

export class P2PError extends Error {
    constructor(message: string) {
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

export class PeerStatusResponseError extends P2PError {
    constructor(ip: string) {
        super(`Failed to retrieve status from peer ${ip}.`);
    }
}

export class PeerPingTimeoutError extends P2PError {
    constructor(delay: number) {
        super(`Ping timeout (${delay} ms)`);
    }
}

export class PeerVerificationFailedError extends P2PError {
    constructor() {
        super(`Peer verification failed.`);
    }
}
