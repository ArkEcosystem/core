import { InvalidArgumentException, OutOfRangeException } from "./logic";
import { RuntimeException } from "./runtime";

/**
 * @export
 * @class InvalidPluginConfiguration
 * @extends {InvalidArgumentException}
 */
export class InvalidPluginConfiguration extends InvalidArgumentException {
    /**
     * @param {string} name
     * @param {Record<string, string[]>} errors
     * @memberof InvalidPluginConfiguration
     */
    public constructor(name: string, errors: Record<string, string[]>) {
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
    public constructor(name: string, error: string) {
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
    public constructor(name: string, error: string) {
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
    public constructor(dep: string, expected: string, given: string) {
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
     * @param {string} serviceProvider
     * @param {string} dependency
     * @memberof OptionalDependencyCannotBeFound
     */
    public constructor(serviceProvider: string, dependency: string) {
        super(
            `The "${dependency}" package is missing. Please, make sure to install this library to take advantage of ${serviceProvider}.`,
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
     * @param {string} serviceProvider
     * @param {string} dependency
     * @memberof RequiredDependencyCannotBeFound
     */
    public constructor(serviceProvider: string, dependency: string) {
        super(
            `The "${dependency}" package is required but missing. Please, make sure to install this library to take advantage of ${serviceProvider}.`,
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
    public constructor(version: string) {
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
    public constructor(version: string) {
        super(
            `"${version}" is not a valid semantic version. Please check https://semver.org/ and make sure you follow the spec.`,
        );
    }
}
