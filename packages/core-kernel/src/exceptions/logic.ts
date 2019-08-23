// tslint:disable: max-classes-per-file

import { Exception } from "./base";

/**
 * @export
 * @class LogicException
 * @extends {Exception}
 */
export class LogicException extends Exception {}

/**
 * @export
 * @class BadMethodCallException
 * @extends {LogicException}
 */
export class BadMethodCallException extends LogicException {}

/**
 * @export
 * @class DomainException
 * @extends {LogicException}
 */
export class DomainException extends LogicException {}

/**
 * @export
 * @class InvalidArgumentException
 * @extends {LogicException}
 */
export class InvalidArgumentException extends LogicException {}

/**
 * @export
 * @class LengthException
 * @extends {LogicException}
 */
export class LengthException extends LogicException {}

/**
 * @export
 * @class OutOfBoundsException
 * @extends {Exception}
 */
export class OutOfBoundsException extends LogicException {}

/**
 * @export
 * @class OutOfRangeException
 * @extends {Exception}
 */
export class OutOfRangeException extends LogicException {}

/**
 * @export
 * @class MethodNotImplemented
 * @extends {BadMethodCallException}
 */
export class MethodNotImplemented extends BadMethodCallException {
    public constructor(methodName: string) {
        super(`The ${methodName}() is not implemented.`);
    }
}

/**
 * @export
 * @class MethodArgumentNotImplemented
 * @extends {BadMethodCallException}
 */
export class MethodArgumentNotImplemented extends BadMethodCallException {
    public constructor(methodName: string, argName: string) {
        super(`The ${methodName}() method's argument [${argName}] behavior is not implemented.`);
    }
}

/**
 * @export
 * @class MethodArgumentValueNotImplemented
 * @extends {BadMethodCallException}
 */
export class MethodArgumentValueNotImplemented extends BadMethodCallException {
    public constructor(methodName: string, argName: string, argValue) {
        super(`The ${methodName}() method's argument $${argName} value ${argValue} behavior is not implemented.`);
    }
}

/**
 * @export
 * @class UnexpectedType
 * @extends {InvalidArgumentException}
 */
export class UnexpectedType extends InvalidArgumentException {
    /**
     * @param {string} paramName
     * @param {string} expectedType
     * @param {*} givenType
     * @memberof InvalidType
     */
    constructor(paramName: string, expectedType: string, givenType: any) {
        super(`Expected argument [${paramName}] of type ${expectedType}, ${givenType} given`);
    }
}
