import { InvalidArgumentException } from "./logic";

/**
 * @export
 * @class ValidationFailed
 * @extends {InvalidArgumentException}
 */
export class ValidationFailed extends InvalidArgumentException {
    public constructor() {
        super("The given data was invalid.");
    }
}
