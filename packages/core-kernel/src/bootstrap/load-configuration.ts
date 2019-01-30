import { readFileSync } from "fs";
import { safeLoad } from "js-yaml";
import { Kernel } from "../contracts";

export class LoadConfiguration {
    /**
     * Bootstrap the given application.
     */
    public bootstrap(app: Kernel.IApplication): void {
        try {
            const config = safeLoad(readFileSync(app.configPath("config.yml"), "utf8"));

            for (const [key, value] of Object.entries(config)) {
                app.config(key, value);
            }
        } catch (error) {
            throw new Error("Unable to load the application configuration file.");
        }
    }
}
