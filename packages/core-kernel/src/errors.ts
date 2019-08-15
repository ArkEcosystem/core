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
 * @class EntryAlreadyExists
 * @extends {KernelError}
 */
export class EntryAlreadyExists extends KernelError {
    /**
     * @param {string} value
     * @memberof EntryAlreadyExists
     */
    constructor(value: string) {
        super(`[${value}] is not registered.`);
    }
}

/**
 * @export
 * @class EntryDoesNotExist
 * @extends {KernelError}
 */
export class EntryDoesNotExist extends KernelError {
    /**
     * @param {string} value
     * @memberof EntryDoesNotExist
     */
    constructor(value: string) {
        super(`[${value}] is not registered.`);
    }
}

/**
 * @export
 * @class FileNotFound
 * @extends {KernelError}
 */
export class FileNotFound extends KernelError {
    /**
     * @param {string} value
     * @memberof FileNotFound
     */
    constructor(value: string) {
        super(`File [${value}] could not be found.`);
    }
}

/**
 * @export
 * @class InvalidArgument
 * @extends {KernelError}
 */
export class InvalidArgument extends KernelError {
    /**
     * @param {*} value
     * @memberof InvalidArgument
     */
    constructor(value: any) {
        super(`[${value.toString()}] is an invalid argument.`);
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
 * @class InvalidConfigurationAdapter
 * @extends {KernelError}
 */
export class InvalidConfigurationAdapter extends KernelError {
    /**
     * @memberof InvalidConfigurationAdapter
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
        super("Unable to detect application token or network.");
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
     * @param {string} dep
     * @memberof FailedServiceProviderRegistration
     */
    constructor(name: string, dep: string) {
        super(`Failed to register "${name}" as we did not detect "${dep}".`);
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
