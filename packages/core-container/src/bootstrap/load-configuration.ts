import { readFileSync } from "fs";
import { safeLoad } from "js-yaml";

export class LoadConfiguration {
    /**
     * Bootstrap the given application.
     */
    public bootstrap(app): void {
        try {
            const config = safeLoad(readFileSync(app.configPath("config.yml"), "utf8"));

            for (const [key, value] of Object.entries(config)) {
                app.config.set(key, value);
            }
        } catch (error) {
            throw new Error("Unable to load the application configuration file.");
        }
    }
}
