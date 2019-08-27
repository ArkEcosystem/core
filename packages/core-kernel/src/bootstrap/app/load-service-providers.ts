import { JsonObject } from "../../types";
import {
    AbstractServiceProvider,
    ServiceProviderRepository,
    PackageConfiguration,
    PackageManifest,
} from "../../providers";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject, Identifiers } from "../../container";

/**
 * @export
 * @class LoadServiceProviders
 * @implements {Bootstrapper}
 */
@injectable()
export class LoadServiceProviders implements Bootstrapper {
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
        for (const [name, opts] of Object.entries(this.app.config<JsonObject>("packages"))) {
            const serviceProvider: AbstractServiceProvider = this.app.resolve(require(name).ServiceProvider);
            serviceProvider.setManifest(this.app.resolve(PackageManifest).discover(name));
            serviceProvider.setConfig(this.discoverConfiguration(serviceProvider, opts as JsonObject));

            this.app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository).set(name, serviceProvider);
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
                .resolve(PackageConfiguration)
                .from(serviceProvider.name(), serviceProvider.configDefaults())
                .merge(opts);
        }

        return this.app
            .resolve(PackageConfiguration)
            .discover(serviceProvider.name())
            .merge(opts);
    }
}
