import { Exceptions } from "@arkecosystem/core-kernel";

export class ActionAlreadyExistsException extends Exceptions.Base.Exception {
    constructor(name: string) {
        super(`Action ${name} already exists in registry.`);
    }
}

export class ActionNotFoundException extends Exceptions.Base.Exception {
    constructor(name: string) {
        super(`Action ${name} was not found.`);
    }
}
