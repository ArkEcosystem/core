// tslint:disable: max-classes-per-file

import { InvalidArgumentException } from "./logic";

/**
 * @export
 * @class ConfigurationException
 * @extends {InvalidArgumentException}
 */
export class ConfigurationException extends InvalidArgumentException {}

/**
 * @export
 * @class InvalidConfigurationException
 * @extends {ConfigurationException}
 */
export class InvalidConfiguration extends ConfigurationException {}

/**
 * @export
 * @class EnvNotFoundException
 * @extends {ConfigurationException}
 */
export class EnvNotFound extends ConfigurationException {}

/**
 * @export
 * @class EnvParameterException
 * @extends {ConfigurationException}
 */
export class EnvParameter extends ConfigurationException {}

/**
 * @export
 * @class ApplicationConfigurationCannotBeLoaded
 * @extends {ConfigurationException}
 */
export class ApplicationConfigurationCannotBeLoaded extends ConfigurationException {
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
 * @extends {ConfigurationException}
 */
export class EnvironmentConfigurationCannotBeLoaded extends ConfigurationException {
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
 * @extends {ConfigurationException}
 */
export class NetworkCannotBeDetermined extends ConfigurationException {
    /**
     * @memberof NetworkCannotBeDetermined
     */
    constructor() {
        super("Unable to discover application token or network.");
    }
}
