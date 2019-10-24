import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { PluginConfiguration, PluginManifest, ServiceProvider, ServiceProviderRepository } from "../../providers";
import { ConfigRepository } from "../../services/config";
import { JsonObject } from "../../types";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";

interface PluginEntry {
    package: string;
    options: JsonObject;
}

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
    private readonly app!: Application;

    /**
     * @private
     * @type {ConfigRepository}
     * @memberof RegisterBasePaths
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository!: ConfigRepository;

    /**
     * @private
     * @type {ServiceProviderRepository}
     * @memberof RegisterBasePaths
     */
    @inject(Identifiers.ServiceProviderRepository)
    private readonly serviceProviderRepository!: ServiceProviderRepository;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const plugins: PluginEntry[] = assert.defined(this.configRepository.get<PluginEntry[]>("app.plugins"));

        for (const plugin of plugins) {
            const serviceProvider: ServiceProvider = this.app.resolve(require(plugin.package).ServiceProvider);
            serviceProvider.setManifest(this.app.resolve(PluginManifest).discover(plugin.package));
            serviceProvider.setConfig(this.discoverConfiguration(serviceProvider, plugin.options));

            this.serviceProviderRepository.set(plugin.package, serviceProvider);

            const alias: string | undefined = serviceProvider.alias();

            if (alias) {
                this.serviceProviderRepository.alias(plugin.package, alias);
            }
        }
    }

    /**
     * Discover the configuration for the package of the given service provider.
     *
     * @private
     * @param {ServiceProvider} serviceProvider
     * @param {JsonObject} options
     * @returns {PluginConfiguration}
     * @memberof LoadServiceProviders
     */
    private discoverConfiguration(serviceProvider: ServiceProvider, options: JsonObject): PluginConfiguration {
        const serviceProviderName: string = assert.defined(serviceProvider.name());
        const hasDefaults: boolean = Object.keys(serviceProvider.configDefaults()).length > 0;

        if (hasDefaults) {
            return this.app
                .resolve(PluginConfiguration)
                .from(serviceProviderName, serviceProvider.configDefaults())
                .merge(options);
        }

        return this.app
            .resolve(PluginConfiguration)
            .discover(serviceProviderName)
            .merge(options);
    }
}
