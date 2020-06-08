import { Interfaces } from "@arkecosystem/crypto";

export class ServerError extends Error {
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

export class TooManyTransactionsError extends ServerError {
    public constructor(block: Interfaces.IBlockData) {
        super(
            `Received block ${block.id} at height ${block.height} contained too many transactions (${block.numberOfTransactions}).`,
        );
    }
}

export class UnchainedBlockError extends ServerError {
    public constructor(lastHeight: number, nextHeight: number) {
        super(`Last received block ${nextHeight} cannot be chained to ${lastHeight}.`);
    }
}
