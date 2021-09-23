"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Newline.
 */
const EOL = '\n';
/**
 * An extendable error class.
 * @author https://github.com/bjyoungblood/es6-error/
 */
class ExtendableError extends Error {
    /**
     * Constructor for the error.
     *
     * @param  {String} message
     * The error message.
     */
    constructor(message) {
        super(message);
        // extending Error is weird and does not propagate `message`
        Object.defineProperty(this, 'message', {
            enumerable: false,
            value: message
        });
        Object.defineProperty(this, 'name', {
            enumerable: false,
            value: this.constructor.name
        });
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ExtendableError = ExtendableError;
/**
 * Base error for all Awilix-specific errors.
 */
class AwilixError extends ExtendableError {
}
exports.AwilixError = AwilixError;
/**
 * Error thrown to indicate a type mismatch.
 * TODO(v3): remove `AwilixNotAFunctionError` and use this.
 */
class AwilixTypeError extends AwilixError {
    /**
     * Constructor, takes the function name, expected and given
     * type to produce an error.
     *
     * @param {string} funcDescription
     * Name of the function being guarded.
     *
     * @param {string} paramName
     * The parameter there was an issue with.
     *
     * @param {string} expectedType
     * Name of the expected type.
     *
     * @param {string} givenType
     * Name of the given type.
     */
    constructor(funcDescription, paramName, expectedType, givenType) {
        super(`${funcDescription}: expected ${paramName} to be ${expectedType}, but got ${givenType}.`);
    }
    /**
     * Asserts the given condition, throws an error otherwise.
     *
     * @param {*} condition
     * The condition to check
     *
     * @param {string} funcDescription
     * Name of the function being guarded.
     *
     * @param {string} paramName
     * The parameter there was an issue with.
     *
     * @param {string} expectedType
     * Name of the expected type.
     *
     * @param {string} givenType
     * Name of the given type.
     */
    static assert(condition, funcDescription, paramName, expectedType, givenType) {
        if (!condition) {
            throw new AwilixTypeError(funcDescription, paramName, expectedType, givenType);
        }
        return condition;
    }
}
exports.AwilixTypeError = AwilixTypeError;
/**
 * A nice error class so we can do an instanceOf check.
 */
class AwilixResolutionError extends AwilixError {
    /**
     * Constructor, takes the registered modules and unresolved tokens
     * to create a message.
     *
     * @param {string|symbol} name
     * The name of the module that could not be resolved.
     *
     * @param  {string[]} resolutionStack
     * The current resolution stack
     */
    constructor(name, resolutionStack, message) {
        if (typeof name === 'symbol') {
            name = name.toString();
        }
        resolutionStack = resolutionStack.slice();
        resolutionStack.push(name);
        const resolutionPathString = resolutionStack.join(' -> ');
        let msg = `Could not resolve '${name}'.`;
        if (message) {
            msg += ` ${message}`;
        }
        msg += EOL + EOL;
        msg += `Resolution path: ${resolutionPathString}`;
        super(msg);
    }
}
exports.AwilixResolutionError = AwilixResolutionError;
//# sourceMappingURL=errors.js.map