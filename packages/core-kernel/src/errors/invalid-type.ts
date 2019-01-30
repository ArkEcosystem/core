import { ExtendableError } from "./custom-error";

export class InvalidType extends ExtendableError {
    constructor(funcDescription: string, paramName: string, expectedType: string, givenType: any) {
        super(`${funcDescription}: expected ${paramName} to be ${expectedType}, but got ${givenType}.`);
    }
}
