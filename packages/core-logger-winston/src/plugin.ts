import { Container } from "@arkecosystem/core-interfaces";
import { LogManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Container.IContainer, options) {
        const logManager: LogManager = container.resolvePlugin("logManager");
        await logManager.makeDriver(new WinstonLogger(options));

        const driver = logManager.driver();
        driver.debug(`Data Directory   => ${process.env.ARK_PATH_DATA}`);
        driver.debug(`Config Directory => ${process.env.ARK_PATH_CONFIG}`);

        if (process.env.ARK_PATH_CACHE) {
            driver.debug(`Cache Directory  => ${process.env.ARK_PATH_CACHE}`);
        }

        if (process.env.ARK_PATH_LOG) {
            driver.debug(`Log Directory  => ${process.env.ARK_PATH_LOG}`);
        }

        if (process.env.ARK_PATH_TEMP) {
            driver.debug(`Temp Directory  => ${process.env.ARK_PATH_TEMP}`);
        }

        return driver;
    },
};
