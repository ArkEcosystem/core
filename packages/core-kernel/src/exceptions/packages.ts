// tslint:disable: max-classes-per-file

import { InvalidArgumentException, OutOfRangeException } from "./logic";
import { RuntimeException } from "./runtime";

/**
 * @export
 * @class InvalidPackageConfiguration
 * @extends {InvalidArgumentException}
 */
export class InvalidPackageConfiguration extends InvalidArgumentException {
    /**
     * @param {string} name
     * @param {Record<string, string[]>} errors
     * @memberof InvalidPackageConfiguration
     */
    constructor(name: string, errors: Record<string, string[]>) {
        super(`[${name}] Failed to validate the configuration: "${JSON.stringify(errors, undefined, 4)}".`);
    }
}

/**
 * @export
 * @class ServiceProviderCannotBeRegistered
 * @extends {RuntimeException}
 */
export class ServiceProviderCannotBeRegistered extends RuntimeException {
    /**
     * @param {string} name
     * @param {string} error
     * @memberof ServiceProviderCannotBeRegistered
     */
    constructor(name: string, error: string) {
        super(`[${name}] Failed to register: "${error}".`);
    }
}

/**
 * @export
 * @class ServiceProviderCannotBeBooted
 * @extends {RuntimeException}
 */
export class ServiceProviderCannotBeBooted extends RuntimeException {
    /**
     * @param {string} name
     * @param {string} error
     * @memberof ServiceProviderCannotBeBooted
     */
    constructor(name: string, error: string) {
        super(`[${name}] Failed to boot: "${error}".`);
    }
}

/**
 * @export
 * @class DependencyVersionOutOfRange
 * @extends {OutOfRangeException}
 */
export class DependencyVersionOutOfRange extends OutOfRangeException {
    /**
     * @param {string} dep
     * @param {string} expected
     * @param {string} given
     * @memberof DependencyVersionOutOfRange
     */
    constructor(dep: string, expected: string, given: string) {
        super(`Expected "${dep}" to satisfy "${expected}" but received "${given}".`);
    }
}

/**
 * @export
 * @class OptionalDependencyCannotBeFound
 * @extends {RuntimeException}
 */
export class OptionalDependencyCannotBeFound extends RuntimeException {
    /**
     * @param {string} name
     * @param {string} reason
     * @memberof OptionalDependencyCannotBeFound
     */
    constructor(name: string, reason: string) {
        super(
            `The "${name}" package is missing. Please, make sure to install this library to take advantage of ${reason}.`,
        );
    }
}

/**
 * @export
 * @class RequiredDependencyCannotBeFound
 * @extends {RuntimeException}
 */
export class RequiredDependencyCannotBeFound extends RuntimeException {
    /**
     * @param {string} name
     * @param {string} reason
     * @memberof RequiredDependencyCannotBeFound
     */
    constructor(name: string, reason: string) {
        super(
            `The "${name}" package is required but missing. Please, make sure to install this library to take advantage of ${reason}.`,
        );
    }
}

/**
 * @export
 * @class InvalidVersion
 * @extends {InvalidArgumentException}
 */
export class InvalidVersion extends InvalidArgumentException {
    /**
     * @param {string} version
     * @memberof InvalidVersion
     */
    constructor(version: string) {
        super(
            `"${version}" is not a valid semantic version. Please check https://semver.org/ and make sure you follow the spec.`,
        );
    }
}

/**
 * @export
 * @class UnsupportedVersionConstraint
 * @extends {RuntimeException}
 */
export class UnsupportedVersionConstraint extends RuntimeException {
    /**
     * @param {string} version
     * @memberof InvalidVersion
     */
    constructor(version: string) {
        super(
            `"${version}" is not a valid semantic version. Please check https://semver.org/ and make sure you follow the spec.`,
        );
    }
}
