// tslint:disable:max-classes-per-file

/**
 * @export
 * @class KernelError
 * @extends {Error}
 */
export class KernelError extends Error {
    /**
     * @param {string} message
     * @memberof KernelError
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
 * @class DirectoryNotFound
 * @extends {KernelError}
 */
export class DirectoryNotFound extends KernelError {
    /**
     * @param {string} value
     * @memberof DirectoryNotFound
     */
    constructor(value: string) {
        super(`Directory [${value}] could not be found.`);
    }
}

/**
 * @export
 * @class InvalidType
 * @extends {KernelError}
 */
export class InvalidType extends KernelError {
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
 * @extends {KernelError}
 */
export class InvalidVersion extends KernelError {
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
 * @class InvalidApplicationConfiguration
 * @extends {KernelError}
 */
export class InvalidApplicationConfiguration extends KernelError {
    /**
     * @memberof InvalidApplicationConfiguration
     */
    constructor() {
        super("Unable to load the application configuration file.");
    }
}

/**
 * @export
 * @class InvalidEnvironmentConfiguration
 * @extends {KernelError}
 */
export class InvalidEnvironmentConfiguration extends KernelError {
    /**
     * @memberof InvalidEnvironmentConfiguration
     */
    constructor() {
        super("Unable to load the environment file.");
    }
}

/**
 * @export
 * @class FailedNetworkDetection
 * @extends {KernelError}
 */
export class FailedNetworkDetection extends KernelError {
    /**
     * @memberof FailedNetworkDetection
     */
    constructor() {
        super("Unable to discover application token or network.");
    }
}
/**
 * @export
 * @class InvalidPackageConfiguration
 * @extends {KernelError}
 */
export class InvalidPackageConfiguration extends KernelError {
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
 * @class FailedServiceProviderRegistration
 * @extends {KernelError}
 */
export class FailedServiceProviderRegistration extends KernelError {
    /**
     * @param {string} name
     * @param {string} error
     * @memberof FailedServiceProviderRegistration
     */
    constructor(name: string, error: string) {
        super(`[${name}] Failed to register: "${error}".`);
    }
}

/**
 * @export
 * @class FailedServiceProviderBoot
 * @extends {KernelError}
 */
export class FailedServiceProviderBoot extends KernelError {
    /**
     * @param {string} name
     * @param {string} error
     * @memberof FailedServiceProviderBoot
     */
    constructor(name: string, error: string) {
        super(`[${name}] Failed to boot: "${error}".`);
    }
}

/**
 * @export
 * @class FailedDependencySatisfaction
 * @extends {KernelError}
 */
export class FailedDependencySatisfaction extends KernelError {
    /**
     * @param {string} dep
     * @param {string} expected
     * @param {string} given
     * @memberof FailedDependencySatisfaction
     */
    constructor(dep: string, expected: string, given: string) {
        super(`Expected "${dep}" to satisfy "${expected}" but received "${given}".`);
    }
}

/**
 * @export
 * @class MissingDependency
 * @extends {KernelError}
 */
export class MissingDependency extends KernelError {
    /**
     * @param {string} dep
     * @param {string} expected
     * @param {string} given
     * @memberof FailedDependencySatisfaction
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
 * @class NotImplementedError
 * @extends {KernelError}
 */
export class NotImplementedError extends KernelError {
    /**
     * @param {string} klass
     * @param {string} method
     * @memberof NotImplementedError
     */
    constructor(klass: string, method: string) {
        super(`Method [${method}] is not implemented in [${klass}].`);
    }
}

/**
 * @export
 * @class InvalidBindingName
 * @extends {KernelError}
 */
export class InvalidBindingName extends KernelError {
    /**
     * @param {string} name
     * @memberof InvalidBindingName
     */
    constructor(name: string) {
        super(`The name/prefix [${name}] is reserved.`);
    }
}
