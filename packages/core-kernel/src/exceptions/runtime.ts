import { Exception } from "./base";

/**
 * @export
 * @class RuntimeException
 * @extends {Exception}
 */
export class RuntimeException extends Exception {}

/**
 * @export
 * @class OverflowException
 * @extends {Exception}
 */
export class OverflowException extends RuntimeException {}

/**
 * @export
 * @class RangeException
 * @extends {Exception}
 */
export class RangeException extends RuntimeException {}

/**
 * @export
 * @class UnderflowException
 * @extends {Exception}
 */
export class UnderflowException extends RuntimeException {}

/**
 * @export
 * @class UnexpectedValueException
 * @extends {Exception}
 */
export class UnexpectedValueException extends RuntimeException {}

/**
 * @export
 * @class NotImplemented
 * @extends {Exception}
 */
export class NotImplemented extends RuntimeException {
    /**
     * @param {string} method
     * @param {string} klass
     * @memberof NotImplemented
     */
    constructor(method: string, klass: string) {
        super(`Method [${method}] is not implemented in [${klass}].`);
    }
}
