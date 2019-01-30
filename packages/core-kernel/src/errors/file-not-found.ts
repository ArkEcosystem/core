import { ExtendableError } from "./custom-error";

export class FileNotFound extends ExtendableError {
    constructor(value: string) {
        super(`File [${value}] could not be found.`);
    }
}
