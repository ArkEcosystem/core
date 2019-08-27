import semver from "semver";
import { Kernel } from "../../contracts";
import {
    RequiredDependencyCannotBeFound,
    DependencyVersionOutOfRange,
    InvalidPackageConfiguration,
    ServiceProviderCannotBeRegistered,
    OptionalDependencyCannotBeFound,
} from "../../exceptions/packages";
import { ConfigRepository } from "../../services/config";
import { ValidationManager } from "../../services/validation";
import { ServiceProvider, ServiceProviderRepository, PackageConfiguration } from "../../providers";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject, Identifiers } from "../../container";

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
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            // Shall we include the plugin?
            if (!this.shouldBeIncluded(serviceProvider.name()) || this.shouldBeExcluded(serviceProvider.name())) {
                continue;
            }

            // Determine if the plugin is required to decide how to handle errors.
            const isRequired: boolean = await serviceProvider.required();

            // Does the configuration conform to the given rules?
            try {
                await this.validateConfiguration(serviceProvider);
            } catch (error) {
                if (isRequired) {
                    throw new ServiceProviderCannotBeRegistered(serviceProvider.name(), error.message);
                }

                serviceProviders.fail(serviceProvider.name());

                continue;
            }

            // Are all dependencies installed with the correct versions?
            if (await this.satisfiesDependencies(serviceProvider)) {
                try {
                    this.app.log.debug(`Registering ${serviceProvider.name()}...`);

                    await serviceProviders.register(name);
                } catch (error) {
                    if (isRequired) {
                        throw new ServiceProviderCannotBeRegistered(serviceProvider.name(), error.message);
                    }

                    serviceProviders.fail(serviceProvider.name());
                }
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
            const config: PackageConfiguration = serviceProvider.config();

            const validator: Kernel.Validation.Validator = this.app
                .get<ValidationManager>(Identifiers.ValidationManager)
                .driver();

            validator.validate(config.all(), configSchema);

            if (validator.fails()) {
                throw new InvalidPackageConfiguration(serviceProvider.name(), validator.errors());
            }

            serviceProvider.setConfig(config.merge(validator.valid()));
        }
    }

    /**
     * @private
     * @param {ServiceProvider} serviceProvider
     * @returns {Promise<boolean>}
     * @memberof RegisterProviders
     */
    private async satisfiesDependencies(serviceProvider: ServiceProvider): Promise<boolean> {
        const dependencies: Kernel.PackageDependency[] = serviceProvider.dependencies();

        if (!dependencies) {
            return true;
        }

        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const dependency of dependencies) {
            const { name, version, required } = dependency;

            if (!serviceProviders.has(name)) {
                const isRequired: boolean = typeof required === "function" ? await required() : !!required;

                // The dependency is necessary for this package to function. We'll output an error and terminate the process.
                if (isRequired) {
                    const error: RequiredDependencyCannotBeFound = new RequiredDependencyCannotBeFound(
                        serviceProvider.name(),
                        name,
                    );

                    await this.app.terminate(error.message, error);
                }

                // The dependency is optional for this package to function. We'll only output a warning.
                const error: OptionalDependencyCannotBeFound = new OptionalDependencyCannotBeFound(
                    serviceProvider.name(),
                    name,
                );

                this.app.log.warning(error.message);

                serviceProviders.fail(serviceProvider.version());

                return false;
            }

            if (version) {
                const constraint: string = serviceProviders.get(name).name();

                if (!semver.satisfies(constraint, version)) {
                    serviceProviders.fail(serviceProvider.name());

                    throw new DependencyVersionOutOfRange(name, constraint, version);
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
        const includes: string[] = this.app
            .get<ConfigRepository>(Identifiers.ConfigRepository)
            .get<string[]>("include", []);

        return includes.length > 0 ? includes.includes(name) : true;
    }

    /**
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof RegisterServiceProviders
     */
    private shouldBeExcluded(name: string): boolean {
        const excludes: string[] = this.app
            .get<ConfigRepository>(Identifiers.ConfigRepository)
            .get<string[]>("exclude", []);

        return excludes.length > 0 ? excludes.includes(name) : false;
    }
}
