import cosmiconfig from "cosmiconfig";
import { set } from "dottie";
import { parseFileSync } from "envfile";
import { JsonObject } from "type-fest";
import { Kernel } from "../../../contracts";
import { InvalidApplicationConfiguration, InvalidEnvironmentConfiguration } from "../../../errors";

/**
 * @export
 * @class Local
 * @implements {Kernel.IConfigAdapter}
 */
export class Local implements Kernel.IConfigAdapter {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.IApplication}
     * @memberof Manager
     */
    protected readonly app: Kernel.IApplication;

    /**
     * Create a new manager instance.
     *
     * @param {{ app:Kernel.IApplication }} { app }
     * @memberof Manager
     */
    public constructor({ app }: { app: Kernel.IApplication }) {
        this.app = app;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Local
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
     * @memberof Local
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
     * @memberof Local
     */
    private async loadServiceProviders(): Promise<void> {
        this.app.config(
            "service-providers",
            this.loadFromLocation([
                this.app.configPath("service-providers.json"),
                this.app.configPath("service-providers.js"),
            ]),
        );
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Local
     */
    private async loadPeers(): Promise<void> {
        this.app.config("peers", this.loadFromLocation([this.app.configPath("peers.json")]));
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Local
     */
    private async loadDelegates(): Promise<void> {
        this.app.config("delegates", this.loadFromLocation([this.app.configPath("delegates.json")]));
    }

    /**
     * @private
     * @param {string[]} searchPlaces
     * @returns {JsonObject}
     * @memberof Local
     */
    private loadFromLocation(searchPlaces: string[]): JsonObject {
        return cosmiconfig(this.app.namespace(), {
            searchPlaces,
            stopDir: this.app.configPath(),
        }).searchSync().config;
    }
}
