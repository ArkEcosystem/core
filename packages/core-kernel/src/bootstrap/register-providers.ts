import semver from "semver";
import { Kernel } from "../contracts";
import { FailedDependencySatisfaction, FailedServiceProviderRegistration } from "../errors";
import { AbstractServiceProvider } from "../support/service-provider";

/**
 * @export
 * @class RegisterProviders
 */
export class RegisterProviders {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        const providers = app.config("providers");

        for (const [pkg, opts] of Object.entries(providers)) {
            const { ServiceProvider } = require(pkg);

            const serviceProvider: AbstractServiceProvider = app.makeProvider(ServiceProvider, opts);

            if (this.satisfiesDependencies(app, serviceProvider)) {
                await app.registerProvider(serviceProvider);
            }
        }
    }

    /**
     * @private
     * @param {Kernel.IApplication} app
     * @param {AbstractServiceProvider} serviceProvider
     * @returns {boolean}
     * @memberof RegisterProviders
     */
    private satisfiesDependencies(app: Kernel.IApplication, serviceProvider: AbstractServiceProvider): boolean {
        const dependencies = serviceProvider.depends();

        if (!dependencies) {
            return true;
        }

        for (const [dep, version] of Object.entries(dependencies)) {
            if (!app.has(dep)) {
                throw new FailedServiceProviderRegistration(serviceProvider.getName(), dep);
            }

            // @ts-ignore
            const constraint = app.resolve(dep).getVersion();

            if (semver.satisfies(constraint, version)) {
                throw new FailedDependencySatisfaction(dep, constraint, version);
            }
        }

        return true;
    }
}
