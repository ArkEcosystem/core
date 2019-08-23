import { JsonObject } from "type-fest";
import { AbstractServiceProvider, ServiceProviderRepository } from "../../support";
import { PackageConfiguration } from "../../support/package-configuration";
import { PackageManifest } from "../../support/package-manifest";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadServiceProviders
 * @extends {AbstractBootstrapper}
 */
export class LoadServiceProviders extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        for (const [name, opts] of Object.entries(this.app.config<JsonObject>("packages"))) {
            const serviceProvider: AbstractServiceProvider = this.app.build(require(name).ServiceProvider);
            serviceProvider.setManifest(this.app.build(PackageManifest).discover(name));
            serviceProvider.setConfig(this.discoverConfiguration(serviceProvider, opts as JsonObject));

            this.app.resolve<ServiceProviderRepository>("serviceProviderRepository").set(name, serviceProvider);
        }
    }

    /**
     * Discover the configuration for the package of the given service provider.
     *
     * @private
     * @param {AbstractServiceProvider} serviceProvider
     * @param {JsonObject} opts
     * @returns {PackageConfiguration}
     * @memberof LoadServiceProviders
     */
    private discoverConfiguration(serviceProvider: AbstractServiceProvider, opts: JsonObject): PackageConfiguration {
        const hasDefaults: boolean = Object.keys(serviceProvider.configDefaults()).length > 0;

        if (hasDefaults) {
            return this.app
                .build(PackageConfiguration)
                .from(serviceProvider.name(), serviceProvider.configDefaults())
                .merge(opts);
        }

        return this.app
            .build(PackageConfiguration)
            .discover(serviceProvider.name())
            .merge(opts);
    }
}
