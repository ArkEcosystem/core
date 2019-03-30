import { Logger } from "@arkecosystem/core-interfaces";

export class LogManager {
    private readonly drivers: Map<string, Logger.ILogger> = new Map();

    public driver(name: string = "default"): Logger.ILogger {
        return this.drivers.get(name);
    }

    public async makeDriver(driver: Logger.ILogger, name: string = "default"): Promise<Logger.ILogger> {
        this.drivers.set(name, await driver.make());

        this.logPaths();

        return this.driver();
    }

    private logPaths(): void {
        const driver = this.driver();
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
    }
}
