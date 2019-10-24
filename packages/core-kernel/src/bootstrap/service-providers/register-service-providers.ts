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
import { ConfigRepository } from "../../services/config";
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
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            const serviceProviderName: string = assert.defined(serviceProvider.name());

            try {
                // Shall we include the plugin?
                if (!this.shouldBeIncluded(serviceProviderName) || this.shouldBeExcluded(serviceProviderName)) {
                    continue;
                }

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

            const validator: Kernel.Validation.Validator = assert.defined(
                this.app.get<ValidationManager>(Identifiers.ValidationManager).driver(),
            );

            validator.validate(config.all(), configSchema);

            if (validator.fails()) {
                throw new InvalidPluginConfiguration(assert.defined(serviceProvider.name()), validator.errors());
            }

            serviceProvider.setConfig(config.merge(validator.valid() || {}));
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

            const serviceProviderName: string = assert.defined(serviceProvider.name());

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

                this.app.log.warning(error.message);

                serviceProviders.fail(serviceProviderName);

                return false;
            }

            /* istanbul ignore else */
            if (constraint) {
                const version: string = assert.defined(serviceProviders.get(name).version());

                /* istanbul ignore else */
                if (!semver.satisfies(version, constraint)) {
                    const error: DependencyVersionOutOfRange = new DependencyVersionOutOfRange(
                        name,
                        constraint,
                        version,
                    );

                    if (isRequired) {
                        await this.app.terminate(error.message, error);
                    }

                    this.app.log.warning(error.message);

                    serviceProviders.fail(serviceProviderName);
                }
            }
        }

        return true;
    }

    /**
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof RegisterServiceProviders
     */
    private shouldBeIncluded(name: string): boolean {
        const includes: string[] | undefined = this.app
            .get<ConfigRepository>(Identifiers.ConfigRepository)
            .get<string[]>("app.pluginOptions.include", []);

        return includes && includes.length > 0 ? includes.includes(name) : true;
    }

    /**
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof RegisterServiceProviders
     */
    private shouldBeExcluded(name: string): boolean {
        const excludes: string[] | undefined = this.app
            .get<ConfigRepository>(Identifiers.ConfigRepository)
            .get<string[]>("app.pluginOptions.exclude", []);

        return excludes && excludes.length > 0 ? excludes.includes(name) : false;
    }
}
