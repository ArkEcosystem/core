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
     * @returns {Promise<void>}
     * @memberof LocalConfigLoader
     */
    public async loadConfiguration(): Promise<void> {
        try {
            this.loadApplication();

            this.loadPeers();

            this.loadDelegates();
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

        this.app.config("app.flags", {
            ...this.app.get<JsonObject>(Identifiers.ConfigFlags),
            ...defaults.flags,
            ...get(config, "flags", {}),
        });

        this.app.config("app.services", { ...defaults.services, ...get(config, "services", {}) });

        this.app.config("app.plugins", [...defaults.plugins, ...get(config, "plugins", [] as any)]);
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadPeers(): void {
        this.app.config("peers", this.loadFromLocation([this.app.configPath("peers.json")]));
    }

    /**
     * @private
     * @returns {void}
     * @memberof LocalConfigLoader
     */
    private loadDelegates(): void {
        this.app.config("delegates", this.loadFromLocation([this.app.configPath("delegates.json")]));
    }

    /**
     * @private
     * @param {string[]} searchPlaces
     * @returns {KeyValuePair}
     * @memberof LocalConfigLoader
     */
    private loadFromLocation(searchPlaces: string[]): KeyValuePair {
        return cosmiconfig(this.app.namespace(), {
            searchPlaces,
            stopDir: this.app.configPath(),
        }).searchSync().config;
    }
}
