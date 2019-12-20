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
    public constructor(message: string) {
        super(`Unable to load the application configuration file. ${message}`);
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
    public constructor(message: string) {
        super(`Unable to load the environment file. ${message}`);
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
    public constructor() {
        super("Unable to discover application token or network.");
    }
}
