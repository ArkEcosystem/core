import { Support } from "@arkecosystem/core-kernel";
import { LogManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logManager: LogManager = this.app.resolve("logManager");
        await logManager.makeDriver(new WinstonLogger(this.opts));

        const driver = logManager.driver();
        driver.debug(`Data Directory => ${process.env.CORE_PATH_DATA}`);
        driver.debug(`Config Directory => ${process.env.CORE_PATH_CONFIG}`);

        if (process.env.CORE_PATH_CACHE) {
            driver.debug(`Cache Directory => ${process.env.CORE_PATH_CACHE}`);
        }

        if (process.env.CORE_PATH_LOG) {
            driver.debug(`Log Directory => ${process.env.CORE_PATH_LOG}`);
        }

        if (process.env.CORE_PATH_TEMP) {
            driver.debug(`Temp Directory => ${process.env.CORE_PATH_TEMP}`);
        }

        this.app.bind(this.getAlias(), driver);
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
