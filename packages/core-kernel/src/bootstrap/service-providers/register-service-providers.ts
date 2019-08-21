import semver from "semver";
import { IServiceProviderDependency } from "../../contracts/core-kernel";
// @ts-ignore
import { FailedDependencySatisfaction, FailedServiceProviderRegistration, MissingDependency } from "../../errors";
import { ProviderRepository } from "../../repositories";
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
        const serviceProviders: ProviderRepository = this.app.resolve<ProviderRepository>("service-providers");

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (await this.satisfiesDependencies(serviceProvider)) {
                try {
                    await serviceProviders.register(name);
                } catch (error) {
                    throw new FailedServiceProviderRegistration(serviceProvider.getName(), error.message);
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
        const dependencies: IServiceProviderDependency[] = serviceProvider.getDependencies();

        if (!dependencies) {
            return true;
        }

        const serviceProviders: ProviderRepository = this.app.resolve<ProviderRepository>("service-providers");

        for (const dependency of dependencies) {
            const { name, version, required, requiredWhen } = dependency;

            if (!serviceProviders.has(name)) {
                let isRequired: boolean = !!required;

                if (requiredWhen) {
                    isRequired = await requiredWhen();
                }

                const error: MissingDependency = new MissingDependency(serviceProvider.getName(), name, isRequired);

                // The dependency is necessary for this service to function. We'll output an error and terminate the process.
                if (isRequired) {
                    await this.app.terminate(error.message, error);
                }

                // The dependency is not necessary for this service to function. We'll only output a warning.
                this.app.log.warning(error.message);

                serviceProviders.fail(serviceProvider.getName());

                return false;
            }

            if (version) {
                const constraint: string = serviceProviders.get(name).getVersion();

                if (!semver.satisfies(constraint, version)) {
                    serviceProviders.fail(serviceProvider.getName());

                    throw new FailedDependencySatisfaction(name, constraint, version);
                }
            }
        }

        return true;
    }
}
