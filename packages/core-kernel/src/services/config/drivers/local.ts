import cosmiconfig from "cosmiconfig";
import { set } from "dottie";
import { parseFileSync } from "envfile";
import { JsonObject } from "type-fest";
import { IApplication } from "../../../contracts/kernel";
import { IConfigLoader } from "../../../contracts/kernel/config";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "../../../exceptions/config";

/**
 * @export
 * @class Local
 * @implements {IConfigLoader}
 */
export class Local implements IConfigLoader {
    /**
     * The application instance.
     *
     * @protected
     * @type {IApplication}
     * @memberof Local
     */
    protected readonly app: IApplication;

    /**
     * Create a new manager instance.
     *
     * @param {{ app:IApplication }} { app }
     * @memberof Local
     */
    public constructor({ app }: { app: IApplication }) {
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
            throw new ApplicationConfigurationCannotBeLoaded();
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Local
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @todo: enable this after initial migration
        // if (this.app.runningTests()) {
        //     return;
        // }

        try {
            const config: Record<string, string> = parseFileSync(this.app.environmentFile());

            for (const [key, value] of Object.entries(config)) {
                set(process.env, key, value);
            }
        } catch (error) {
            throw new EnvironmentConfigurationCannotBeLoaded();
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Local
     */
    private async loadServiceProviders(): Promise<void> {
        this.app.config(
            "packages",
            this.loadFromLocation([this.app.configPath("packages.json"), this.app.configPath("packages.js")]),
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
