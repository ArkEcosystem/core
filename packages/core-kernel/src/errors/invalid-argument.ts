import { ExtendableError } from "./custom-error";

export class InvalidArgument extends ExtendableError {
    constructor(value: any) {
        super(`[${value.toString()}] is an invalid argument.`);
    }
}
