import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { PluginConfiguration, PluginManifest, ServiceProvider, ServiceProviderRepository } from "../../providers";
import { ConfigRepository } from "../../services/config";
import { JsonObject } from "../../types";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";
import { join } from "path";
import { readJSONSync } from "fs-extra";
import glob from "glob";

interface PluginEntry {
    package: string;
    options: JsonObject;
}

interface Plugin {
    path: string;
    name: string;
    version: string;
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
        const plugins: PluginEntry[] | undefined = this.configRepository.get<PluginEntry[]>("app.plugins");

        assert.defined<PluginEntry[]>(plugins);

        const installedPlugins = await this.discoverPlugins(this.app.dataPath("plugins"));

        for (const plugin of plugins) {
            const installedPlugin = installedPlugins.find((installedPlugin) => installedPlugin.name === plugin.package);
            const packageId = installedPlugin ? installedPlugin.path : plugin.package;

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

    private async discoverPlugins(path: string): Promise<Plugin[]> {
        const plugins: Plugin[] = [];

        const packagePaths = glob
            .sync("{*/*/package.json,*/package.json}", { cwd: path })
            .map((packagePath) => join(path, packagePath).slice(0, -"/package.json".length));

        for (let packagePath of packagePaths) {
            const packageJson = readJSONSync(join(packagePath, "package.json"));

            plugins.push({
                path: packagePath,
                name: packageJson.name,
                version: packageJson.version,
            });
        }

        return plugins;
    }
}
