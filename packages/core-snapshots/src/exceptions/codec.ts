import { Exceptions } from "@arkecosystem/core-kernel";

export class BlockDecodeException extends Exceptions.Base.Exception {
    public constructor(id?: string) {
        super(`Block with id ${id} could not be decoded.`);
    }
}

export class BlockEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string) {
        super(`Block with id ${id} could not be encoded.`);
    }
}

export class TransactionDecodeException extends Exceptions.Base.Exception {
    public constructor(id?: string) {
        super(`Transaction with id ${id} could not be decoded.`);
    }
}

export class TransactionEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string) {
        super(`Transaction with id ${id} could not be encoded.`);
    }
}

export class RoundDecodeException extends Exceptions.Base.Exception {
    public constructor(id?: string) {
        super(`Round with id ${id} could not be decoded.`);
    }
}

export class RoundEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string) {
        super(`Round with id ${id} could not be encoded.`);
    }
}
