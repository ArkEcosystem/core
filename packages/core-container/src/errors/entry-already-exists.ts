import { ExtendableError } from "./custom-error";

export class EntryAlreadyExists extends ExtendableError {
    constructor(value: string) {
        super(`[${value}] is not registered.`);
    }
}
