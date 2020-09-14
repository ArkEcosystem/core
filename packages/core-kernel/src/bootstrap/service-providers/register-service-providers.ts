import semver from "semver";

import { Kernel } from "../../contracts";
import { Application } from "../../contracts/kernel";
import {
    DependencyVersionOutOfRange,
    InvalidPluginConfiguration,
    OptionalDependencyCannotBeFound,
    RequiredDependencyCannotBeFound,
    ServiceProviderCannotBeRegistered,
} from "../../exceptions/plugins";
import { Identifiers, inject, injectable } from "../../ioc";
import { PluginConfiguration, ServiceProvider, ServiceProviderRepository } from "../../providers";
import { ValidationManager } from "../../services/validation";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";

// todo: review the implementation
/**
 * @export
 * @class RegisterServiceProviders
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterServiceProviders implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Local
     */
    @inject(Identifiers.LogService)
    private readonly logger!: Kernel.Logger;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            const serviceProviderName: string | undefined = serviceProvider.name();

            assert.defined<string>(serviceProviderName);

            try {
                // Does the configuration conform to the given rules?
                await this.validateConfiguration(serviceProvider);

                // Are all dependencies installed with the correct versions?
                if (await this.satisfiesDependencies(serviceProvider)) {
                    await serviceProviders.register(name);
                }
            } catch (error) {
                console.error(error.stack);

                // Determine if the plugin is required to decide how to handle errors.
                const isRequired: boolean = await serviceProvider.required();

                if (isRequired) {
                    throw new ServiceProviderCannotBeRegistered(serviceProviderName, error.message);
                }

                serviceProviders.fail(serviceProviderName);
            }
        }
    }

    /**
     * @private
     * @param {ServiceProvider} serviceProvider
     * @returns {Promise<void>}
     * @memberof RegisterServiceProviders
     */
    private async validateConfiguration(serviceProvider: ServiceProvider): Promise<void> {
        const configSchema: object = serviceProvider.configSchema();

        if (Object.keys(configSchema).length > 0) {
            const config: PluginConfiguration = serviceProvider.config();

            const validator: Kernel.Validator | undefined = this.app
                .get<ValidationManager>(Identifiers.ValidationManager)
                .driver();

            assert.defined<Kernel.Validator>(validator);

            validator.validate(config.all(), configSchema);

            if (validator.fails()) {
                const serviceProviderName: string | undefined = serviceProvider.name();

                assert.defined<string>(serviceProviderName);

                throw new InvalidPluginConfiguration(serviceProviderName, validator.errors());
            }

            serviceProvider.setConfig(config.merge(/* istanbul ignore next */ validator.valid() || {}));
        }
    }

    /**
     * @private
     * @param {ServiceProvider} serviceProvider
     * @returns {Promise<boolean>}
     * @memberof RegisterProviders
     */
    private async satisfiesDependencies(serviceProvider: ServiceProvider): Promise<boolean> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const dependency of serviceProvider.dependencies()) {
            const { name, version: constraint, required } = dependency;

            const isRequired: boolean = typeof required === "function" ? await required() : !!required;

            const serviceProviderName: string | undefined = serviceProvider.name();

            assert.defined<string>(serviceProviderName);

            if (!serviceProviders.has(name)) {
                // The dependency is necessary for this package to function. We'll output an error and terminate the process.
                if (isRequired) {
                    const error: RequiredDependencyCannotBeFound = new RequiredDependencyCannotBeFound(
                        serviceProviderName,
                        name,
                    );

                    await this.app.terminate(error.message, error);
                }

                // The dependency is optional for this package to function. We'll only output a warning.
                const error: OptionalDependencyCannotBeFound = new OptionalDependencyCannotBeFound(
                    serviceProviderName,
                    name,
                );

                this.logger.warning(error.message);

                serviceProviders.fail(serviceProviderName);

                return false;
            }

            if (constraint) {
                const version: string | undefined = serviceProviders.get(name).version();

                assert.defined<string>(version);

                if (!semver.satisfies(version, constraint)) {
                    const error: DependencyVersionOutOfRange = new DependencyVersionOutOfRange(
                        name,
                        constraint,
                        version,
                    );

                    if (isRequired) {
                        await this.app.terminate(error.message, error);
                    }

                    this.logger.warning(error.message);

                    serviceProviders.fail(serviceProviderName);
                }
            }
        }

        return true;
    }
}
