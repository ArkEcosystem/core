import { Logger } from "@arkecosystem/core-interfaces";

export class LogManager {
    private readonly drivers: Map<string, Logger.ILogger> = new Map<string, Logger.ILogger>();

    public driver(name: string = "default"): Logger.ILogger {
        return this.drivers.get(name);
    }

    public async makeDriver(driver: Logger.ILogger, name: string = "default"): Promise<Logger.ILogger> {
        const instance: Logger.ILogger = await driver.make();

        this.drivers.set(name, instance);

        this.logPaths(instance);

        return this.driver();
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
