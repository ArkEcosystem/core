import { Errors } from "@arkecosystem/crypto";

export class BlockSchemaError extends Errors.CryptoError {
    public constructor(height: number, what: string) {
        super(`Height (${height}): ${what}`);
    }
}

export class PreviousBlockIdFormatError extends Errors.CryptoError {
    public constructor(thisBlockHeight: number, previousBlockId: string) {
        super(
            `The config denotes that the block at height ${thisBlockHeight - 1} ` +
                `must use full SHA256 block id, but the next block (at ${thisBlockHeight}) ` +
                `contains previous block id "${previousBlockId}"`,
        );
    }
}
