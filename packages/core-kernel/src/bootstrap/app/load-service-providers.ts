import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import {
    PluginConfiguration,
    PluginDiscoverer,
    PluginManifest,
    ServiceProvider,
    ServiceProviderRepository,
} from "../../providers";
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
     * @private
     * @type {PluginDiscoverer}
     * @memberof RegisterBasePaths
     */
    @inject(Identifiers.PluginDiscoverer)
    private readonly pluginDiscoverer!: PluginDiscoverer;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const plugins: PluginEntry[] | undefined = this.configRepository.get<PluginEntry[]>("app.plugins");

        assert.defined<PluginEntry[]>(plugins);

        await this.pluginDiscoverer.initialize();

        for (const plugin of plugins) {
            const packageId = this.pluginDiscoverer.get(plugin.package).packageId;

            const serviceProvider: ServiceProvider = this.app.resolve(require(packageId).ServiceProvider);
            serviceProvider.setManifest(this.app.resolve(PluginManifest).discover(packageId));
            serviceProvider.setConfig(this.discoverConfiguration(serviceProvider, plugin.options, packageId));

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
     * @param packageId
     * @returns {PluginConfiguration}
     * @memberof LoadServiceProviders
     */
    private discoverConfiguration(
        serviceProvider: ServiceProvider,
        options: JsonObject,
        packageId: string,
    ): PluginConfiguration {
        const serviceProviderName: string | undefined = serviceProvider.name();

        assert.defined<string>(serviceProviderName);

        const hasDefaults: boolean = Object.keys(serviceProvider.configDefaults()).length > 0;

        if (hasDefaults) {
            return this.app
                .resolve(PluginConfiguration)
                .from(serviceProviderName, serviceProvider.configDefaults())
                .merge(options);
        }

        return this.app.resolve(PluginConfiguration).discover(serviceProviderName, packageId).merge(options);
    }
}
