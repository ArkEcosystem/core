import semver from "semver";
import { FailedDependencySatisfaction, FailedServiceProviderRegistration } from "../../errors";
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
        const providers: ProviderRepository = this.app.resolve<ProviderRepository>("providers");

        for (const [name, serviceProvider] of providers.all()) {
            if (this.satisfiesDependencies(serviceProvider)) {
                // @TODO: check conditional state and mark as either deferred or failed
                // @TODO: check dependencies and either register or mark as failed

                await providers.register(name);
            }
        }
    }

    /**
     * @private
     * @param {AbstractServiceProvider} serviceProvider
     * @returns {boolean}
     * @memberof RegisterProviders
     */
    private satisfiesDependencies(serviceProvider: AbstractServiceProvider): boolean {
        const dependencies: Record<string, string> = serviceProvider.depends();

        if (!dependencies) {
            return true;
        }

        for (const [dep, version] of Object.entries(dependencies)) {
            if (!this.app.has(dep)) {
                throw new FailedServiceProviderRegistration(serviceProvider.getName(), dep);
            }

            const constraint = this.app.resolve(dep).getVersion();

            if (semver.satisfies(constraint, version)) {
                throw new FailedDependencySatisfaction(dep, constraint, version);
            }
        }

        return true;
    }
}
