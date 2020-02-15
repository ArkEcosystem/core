// tslint:disable:max-classes-per-file

import { Interfaces } from "@arkecosystem/crypto";

export class ServerError extends Error {
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

export class InvalidBlockReceivedError extends ServerError {
    constructor(block: Interfaces.IBlockData) {
        super(`Received block ${block.id} at height ${block.height} failed to be verified.`);
    }
}

export class InvalidTransactionsError extends ServerError {
    constructor() {
        super("The payload contains invalid transaction.");
    }
}

export class TooManyTransactionsError extends ServerError {
    constructor(block: Interfaces.IBlockData) {
        super(
            `Received block ${block.id} at height ${block.height} contained too many transactions (${block.numberOfTransactions}).`,
        );
    }
}

export class UnchainedBlockError extends ServerError {
    constructor(lastHeight: number, nextHeight: number) {
        super(`Last received block ${nextHeight} cannot be chained to ${lastHeight}.`);
    }
}
