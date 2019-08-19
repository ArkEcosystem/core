import cosmiconfig from "cosmiconfig";
import { set } from "dottie";
import { parseFileSync } from "envfile";
import { JsonObject } from "type-fest";
import { Kernel } from "../../contracts";
import { InvalidApplicationConfiguration, InvalidEnvironmentConfiguration } from "../../errors";

/**
 * @export
 * @class LocalAdapter
 * @implements {Kernel.IConfigAdapter}
 */
export class LocalAdapter implements Kernel.IConfigAdapter {
    /**
     * @param {Kernel.IApplication} app
     * @memberof BaseAdapter
     */
    public constructor(protected readonly app: Kernel.IApplication) {}

    /**
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    public async loadConfiguration(): Promise<void> {
        try {
            await this.loadServiceProviders();

            await this.loadPeers();

            await this.loadDelegates();
        } catch {
            throw new InvalidApplicationConfiguration();
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @TODO: enable this after initial migration
        // if (this.app.runningTests()) {
        //     return;
        // }

        try {
            const config: Record<string, string> = parseFileSync(this.app.environmentFile());

            for (const [key, value] of Object.entries(config)) {
                set(process.env, key, value);
            }
        } catch (error) {
            throw new InvalidEnvironmentConfiguration();
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    private async loadServiceProviders(): Promise<void> {
        this.app.config(
            "providers",
            this.loadFromLocation([
                this.app.configPath("service-providers.json"),
                this.app.configPath("service-providers.js"),
            ]),
        );
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    private async loadPeers(): Promise<void> {
        this.app.config("peers", this.loadFromLocation([this.app.configPath("peers.json")]));
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    private async loadDelegates(): Promise<void> {
        this.app.config("delegates", this.loadFromLocation([this.app.configPath("delegates.json")]));
    }

    /**
     * @private
     * @param {string[]} searchPlaces
     * @returns {JsonObject}
     * @memberof LocalAdapter
     */
    private loadFromLocation(searchPlaces: string[]): JsonObject {
        return cosmiconfig(this.app.namespace(), {
            searchPlaces,
            stopDir: this.app.configPath(),
        }).searchSync().config;
    }
}
