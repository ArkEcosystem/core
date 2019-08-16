import cosmiconfig from "cosmiconfig";
import { set } from "dottie";
import { parseFileSync } from "envfile";
import { InvalidApplicationConfiguration, InvalidEnvironmentConfiguration } from "../../errors";
import { BaseAdapter } from "./base";

/**
 * @export
 * @class LocalAdapter
 * @extends {BaseAdapter}
 */
export class LocalAdapter extends BaseAdapter {
    /**
     * @returns {Promise<void>}
     * @memberof LocalAdapter
     */
    public async loadConfiguration(): Promise<void> {
        // @TODO: move this to run before `loadConfiguration` in a bootstraper
        await this.loadEnvironmentVariables();

        try {
            const explorer = cosmiconfig(this.app.namespace(), {
                searchPlaces: [this.app.configPath("config.json"), this.app.configPath("config.js")],
                stopDir: this.app.configPath(),
            });

            for (const [key, value] of Object.entries(explorer.searchSync().config)) {
                this.app.config(key, value);
            }
        } catch (error) {
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
}
