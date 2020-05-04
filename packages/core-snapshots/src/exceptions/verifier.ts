import { Exceptions } from "@arkecosystem/core-kernel";

export class BlockVerifyException extends Exceptions.Base.Exception {
    public constructor(id: string, message: string = "") {
        super(`Block with id ${id} could not be verified. ${message}`);
    }
}

export class BlockNotChainedException extends Exceptions.Base.Exception {
    public constructor(id: string) {
        super(`Block with id ${id} is not chained.`);
    }
}

export class TransactionVerifyException extends Exceptions.Base.Exception {
    public constructor(id: string, message: string = "") {
        super(`Transaction with id ${id} could not be verified. ${message}`);
    }
}

export class RoundVerifyException extends Exceptions.Base.Exception {
    public constructor(round: string) {
        super(`Round ${round} could not be verified.`);
    }
}
