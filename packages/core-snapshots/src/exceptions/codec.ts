import { Exceptions } from "@arkecosystem/core-kernel";

export class BlockDecodeException extends Exceptions.Base.Exception {
    public constructor(id: string | undefined, message: string) {
        super(`Block with id ${id} could not be decoded. ${message}`);
    }
}

export class BlockEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string, message: string) {
        super(`Block with id ${id} could not be encoded. ${message}`);
    }
}

export class TransactionDecodeException extends Exceptions.Base.Exception {
    public constructor(id: string | undefined, message: string) {
        super(`Transaction with id ${id} could not be decoded. ${message}`);
    }
}

export class TransactionEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string, message: string) {
        super(`Transaction with id ${id} could not be encoded. ${message}`);
    }
}

export class RoundDecodeException extends Exceptions.Base.Exception {
    public constructor(id: string | undefined, message: string) {
        super(`Round with id ${id} could not be decoded. ${message}`);
    }
}

export class RoundEncodeException extends Exceptions.Base.Exception {
    public constructor(id: string, message: string) {
        super(`Round with id ${id} could not be encoded. ${message}`);
    }
}
