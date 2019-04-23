import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";

export class LoggerFactory {
    public make(driver: Logger.ILogger): Logger.ILogger {
        const instance: Logger.ILogger = driver.make();

        instance.debug(`${app.getName()} ${app.getVersion()}`);
        this.logPaths(instance);

        return instance;
    }

    private logPaths(driver: Logger.ILogger): void {
        for (const [key, value] of Object.entries({
            Data: process.env.CORE_PATH_DATA,
            Config: process.env.CORE_PATH_CONFIG,
            Cache: process.env.CORE_PATH_CACHE,
            Log: process.env.CORE_PATH_LOG,
            Temp: process.env.CORE_PATH_TEMP,
        })) {
            driver.debug(`${key} Directory: ${value}`);
        }
    }
}
