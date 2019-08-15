import { set } from "dottie";
import { parseFileSync } from "envfile";
import { readJSONSync } from "fs-extra";
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
        try {
            const config: Record<string, any> = readJSONSync(this.app.configPath("config.json"));

            for (const [key, value] of Object.entries(config)) {
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
        if (this.app.runningTests()) {
            return;
        }

        try {
            const config = parseFileSync(this.app.environmentFile());

            for (const [key, value] of Object.entries(config)) {
                set(process.env, key, value);
            }
        } catch (error) {
            throw new InvalidEnvironmentConfiguration();
        }
    }
}
