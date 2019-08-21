import semver from "semver";
import { IServiceProviderDependency } from "../../contracts/core-kernel";
import { FailedDependencySatisfaction, FailedServiceProviderRegistration, MissingDependency } from "../../errors";
import { ServiceProviderRepository } from "../../repositories";
import { ConfigRepository } from "../../services/config";
import { AbstractServiceProvider } from "../../support/service-provider";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterServiceProviders
 * @extends {AbstractBootstrapper}
 */
export class RegisterServiceProviders extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.resolve<ServiceProviderRepository>(
            "serviceProviderRepository",
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (!this.shouldBeIncluded(serviceProvider.name()) || this.shouldBeExcluded(serviceProvider.name())) {
                continue;
            }

            if (await this.satisfiesDependencies(serviceProvider)) {
                try {
                    await serviceProviders.register(name);
                } catch (error) {
                    throw new FailedServiceProviderRegistration(serviceProvider.name(), error.message);
                }
            }
        }
    }

    /**
     * @private
     * @param {AbstractServiceProvider} serviceProvider
     * @returns {Promise<boolean>}
     * @memberof RegisterProviders
     */
    private async satisfiesDependencies(serviceProvider: AbstractServiceProvider): Promise<boolean> {
        const dependencies: IServiceProviderDependency[] = serviceProvider.dependencies();

        if (!dependencies) {
            return true;
        }

        const serviceProviders: ServiceProviderRepository = this.app.resolve<ServiceProviderRepository>(
            "serviceProviderRepository",
        );

        for (const dependency of dependencies) {
            const { name, version, required, requiredWhen } = dependency;

            if (!serviceProviders.has(name)) {
                let isRequired: boolean = !!required;

                if (requiredWhen) {
                    isRequired = await requiredWhen();
                }

                const error: MissingDependency = new MissingDependency(serviceProvider.name(), name, isRequired);

                // The dependency is necessary for this package to function. We'll output an error and terminate the process.
                if (isRequired) {
                    await this.app.terminate(error.message, error);
                }

                // The dependency is optional for this package to function. We'll only output a warning.
                this.app.log.warning(error.message);

                serviceProviders.fail(serviceProvider.version());

                return false;
            }

            if (version) {
                const constraint: string = serviceProviders.get(name).name();

                if (!semver.satisfies(constraint, version)) {
                    serviceProviders.fail(serviceProvider.name());

                    throw new FailedDependencySatisfaction(name, constraint, version);
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
        const includes: string[] = this.app.resolve<ConfigRepository>("config").get<string[]>("include", []);

        return includes.length > 0 ? includes.includes(name) : true;
    }

    /**
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof RegisterServiceProviders
     */
    private shouldBeExcluded(name: string): boolean {
        const excludes: string[] = this.app.resolve<ConfigRepository>("config").get<string[]>("exclude", []);

        return excludes.length > 0 ? excludes.includes(name) : false;
    }
}
