import { Exceptions } from "@arkecosystem/core-kernel";

export class BlockVerifyException extends Exceptions.Base.Exception {
    constructor(id: string) {
        super(`Block with id ${id} could not be verified.`);
    }
}

export class BlockNotChainedException extends Exceptions.Base.Exception {
    constructor(id: string) {
        super(`Block with id ${id} is not chained.`);
    }
}

export class TransactionVerifyException extends Exceptions.Base.Exception {
    constructor(id: string) {
        super(`Transaction with id ${id} could not be verified.`);
    }
}

export class RoundVerifyException extends Exceptions.Base.Exception {
    constructor(round: string) {
        super(`Round ${round} could not be verified.`);
    }
}
