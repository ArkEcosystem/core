import { ExtendableError } from "./custom-error";

export class EntryDoesNotExist extends ExtendableError {
    constructor(value: string) {
        super(`[${value}] is not registered.`);
    }
}
