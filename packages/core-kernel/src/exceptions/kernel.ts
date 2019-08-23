// tslint:disable:max-classes-per-file

/**
 * @export
 * @class KernelException
 * @extends {Error}
 */
export class KernelException extends Error {
    /**
     * @param {string} message
     * @memberof KernelException
     */
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message,
        });

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @export
 * @class DirectoryCannotBeFound
 * @extends {KernelException}
 */
export class DirectoryCannotBeFound extends KernelException {
    /**
     * @param {string} value
     * @memberof DirectoryCannotBeFound
     */
    constructor(value: string) {
        super(`Directory [${value}] could not be found.`);
    }
}

/**
 * @export
 * @class InvalidType
 * @extends {KernelException}
 */
export class InvalidType extends KernelException {
    /**
     * @param {string} funcDescription
     * @param {string} paramName
     * @param {string} expectedType
     * @param {*} givenType
     * @memberof InvalidType
     */
    constructor(funcDescription: string, paramName: string, expectedType: string, givenType: any) {
        super(`${funcDescription}: expected ${paramName} to be ${expectedType}, but got ${givenType}.`);
    }
}

/**
 * @export
 * @class InvalidVersion
 * @extends {KernelException}
 */
export class InvalidVersion extends KernelException {
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
 * @class ApplicationConfigurationCannotBeLoaded
 * @extends {KernelException}
 */
export class ApplicationConfigurationCannotBeLoaded extends KernelException {
    /**
     * @memberof ApplicationConfigurationCannotBeLoaded
     */
    constructor() {
        super("Unable to load the application configuration file.");
    }
}

/**
 * @export
 * @class EnvironmentConfigurationCannotBeLoaded
 * @extends {KernelException}
 */
export class EnvironmentConfigurationCannotBeLoaded extends KernelException {
    /**
     * @memberof EnvironmentConfigurationCannotBeLoaded
     */
    constructor() {
        super("Unable to load the environment file.");
    }
}

/**
 * @export
 * @class NetworkCannotBeDetermined
 * @extends {KernelException}
 */
export class NetworkCannotBeDetermined extends KernelException {
    /**
     * @memberof NetworkCannotBeDetermined
     */
    constructor() {
        super("Unable to discover application token or network.");
    }
}
/**
 * @export
 * @class InvalidPackageConfiguration
 * @extends {KernelException}
 */
export class InvalidPackageConfiguration extends KernelException {
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
 * @extends {KernelException}
 */
export class ServiceProviderCannotBeRegistered extends KernelException {
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
 * @extends {KernelException}
 */
export class ServiceProviderCannotBeBooted extends KernelException {
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
 * @extends {KernelException}
 */
export class DependencyVersionOutOfRange extends KernelException {
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
 * @class DependencyDoesNotExist
 * @extends {KernelException}
 */
export class DependencyDoesNotExist extends KernelException {
    /**
     * @param {string} dep
     * @param {string} expected
     * @param {string} given
     * @memberof DependencyVersionOutOfRange
     */
    constructor(serviceProvider: string, dependency: string, required: boolean = false) {
        super(
            `"${serviceProvider}" depends on "${dependency}" but "${dependency}" was not detected. ` +
                (required ? "This is required for its full functionality." : "This might influence its functionality."),
        );
    }
}

/**
 * @export
 * @class NotImplemented
 * @extends {KernelException}
 */
export class NotImplemented extends KernelException {
    /**
     * @param {string} klass
     * @param {string} method
     * @memberof NotImplemented
     */
    constructor(klass: string, method: string) {
        super(`Method [${method}] is not implemented in [${klass}].`);
    }
}

/**
 * @export
 * @class InvalidBindingName
 * @extends {KernelException}
 */
export class InvalidBindingName extends KernelException {
    /**
     * @param {string} name
     * @memberof InvalidBindingName
     */
    constructor(name: string) {
        super(`The name/prefix [${name}] is reserved.`);
    }
}

/**
 * @export
 * @class DriverCannotBeResolved
 * @extends {KernelException}
 */
export class DriverCannotBeResolved extends KernelException {
    /**
     * @param {string} name
     * @memberof DriverCannotBeResolved
     */
    constructor(name: string) {
        super(`Unable to resolve driver for [${name}].'`);
    }
}
