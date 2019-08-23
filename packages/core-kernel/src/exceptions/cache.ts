// tslint:disable: max-classes-per-file

import { Exception } from "./base";

/**
 * @export
 * @class CacheException
 * @extends {Exception}
 */
export class CacheException extends Exception {}

/**
 * @export
 * @class InvalidArgument
 * @extends {CacheException}
 */
export class InvalidArgument extends CacheException {}
