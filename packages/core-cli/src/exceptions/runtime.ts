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
export class FatalException extends RuntimeException {}
