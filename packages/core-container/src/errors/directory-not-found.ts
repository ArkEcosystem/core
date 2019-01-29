import { ExtendableError } from "./custom-error";

export class DirectoryNotFound extends ExtendableError {
    constructor(value: string) {
        super(`Directory [${value}] could not be found.`);
    }
}
