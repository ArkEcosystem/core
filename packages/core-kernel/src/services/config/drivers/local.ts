import { get, set } from "@arkecosystem/utils";
import cosmiconfig from "cosmiconfig";
import { parseFileSync } from "envfile";

import { Application } from "../../../contracts/kernel";
import { ConfigLoader } from "../../../contracts/kernel/config";
import { defaults } from "../../../defaults";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "../../../exceptions/config";
import { Identifiers, inject, injectable } from "../../../ioc";
import { JsonObject, KeyValuePair } from "../../../types";
import { ConfigRepository } from "../repository";

/**
 * @export
 * @class LocalConfigLoader
 * @implements {ConfigLoader}
 */
@injectable()
export class LocalConfigLoader implements ConfigLoader {
    /**
     * The application instance.
     *
     * @protected
     * @type {Application}
     * @memberof LocalConfigLoader
     */
    @inject(Identifiers.Application)
    protected readonly app: Application;

    /**
     * The application configuration.
     *
     * @private
     * @type {ConfigRepository}
     * @memberof LoadCryptography
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository: ConfigRepository;

    /**
     * @returns {Promise<void>}
     * @memberof LocalConfigLoader
     */
    public async loadConfiguration(): Promise<void> {
        try {
            this.loadApplication();

            this.loadPeers();

            this.loadDelegates();

            this.loadCryptography();
        } catch {
            throw new ApplicationConfigurationCannotBeLoaded();
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof LocalConfigLoader
     */
    public async loadEnvironmentVariables(): Promise<void> {
        try {
            const config: Record<string, string> = parseFileSync(this.app.environmentFile());

            for (const [key, value] of Object.entries(config)) {
                set(process.env, key, value);
            }
        } catch {
            throw new EnvironmentConfigurationCannotBeLoaded();
        }
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadApplication(): void {
        const config = this.loadFromLocation([this.app.configPath("app.json"), this.app.configPath("app.js")]);

        this.configRepository.set("app.flags", {
            ...this.app.get<JsonObject>(Identifiers.ConfigFlags),
            ...defaults.flags,
            ...get(config, "flags", {}),
        });

        this.configRepository.set("app.services", { ...defaults.services, ...get(config, "services", {}) });

        this.configRepository.set("app.plugins", [...defaults.plugins, ...get(config, "plugins", [] as any)]);
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadPeers(): void {
        this.configRepository.set("peers", this.loadFromLocation([this.app.configPath("peers.json")]));
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadDelegates(): void {
        this.configRepository.set("delegates", this.loadFromLocation([this.app.configPath("delegates.json")]));
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadCryptography(): void {
        for (const key of ["genesisBlock", "exceptions", "milestones", "network"]) {
            const config: KeyValuePair | undefined = this.loadFromLocation([this.app.configPath(`crypto/${key}.json`)]);

            if (config) {
                this.configRepository.set(`crypto.${key}`, config);
            }
        }
    }

    /**
     * @private
     * @param {string[]} searchPlaces
     * @returns {KeyValuePair}
     * @memberof LocalConfigLoader
     */
    private loadFromLocation(searchPlaces: string[]): KeyValuePair | undefined {
        const result: KeyValuePair | undefined = cosmiconfig(this.app.namespace(), {
            searchPlaces,
            stopDir: this.app.configPath(),
        }).searchSync();

        return result ? result.config : undefined;
    }
}
