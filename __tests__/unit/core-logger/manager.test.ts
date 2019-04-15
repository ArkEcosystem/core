import { AbstractLogger, LoggerManager } from "../../../packages/core-logger/src";
import { LoggerFactory } from "../../../packages/core-logger/src/factory";
import { Logger } from "./__stubs__/logger";

const manager = new LoggerManager();

describe("Manager", () => {
    it("should return the driver", async () => {
        await manager.createDriver(new Logger({}));

        expect(manager.driver()).toBeInstanceOf(AbstractLogger);
    });

    it("should return all drivers", async () => {
        await manager.createDriver(new Logger({}));

        expect(manager.getDrivers()).toBeInstanceOf(Map);
    });

    it("should return the factory", async () => {
        expect(manager.getFactory()).toBeInstanceOf(LoggerFactory);
    });
});
