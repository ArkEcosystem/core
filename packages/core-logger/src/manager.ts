import { Contracts } from "@arkecosystem/core-kernel";

export class LogManager {
    private drivers: Map<string, Contracts.Logger.ILogger>;

    /**
     * Create a new manager instance.
     */
    constructor() {
        this.drivers = new Map();
    }

    /**
     * Get a logger instance.
     * @param  {String} name
     * @return {AbstractLogger}
     */
    public driver(name: string = "default"): Contracts.Logger.ILogger {
        return this.drivers.get(name);
    }

    /**
     * Make the logger instance.
     * @param  {AbstractLogger} driver
     * @param  {String} name
     * @return {void}
     */
    public async makeDriver(driver: Contracts.Logger.ILogger, name: string = "default"): Promise<void> {
        this.drivers.set(name, await driver.make());
    }
}
