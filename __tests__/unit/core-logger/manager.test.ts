import "jest-extended";
import { AbstractLogger, LoggerManager } from "../../../packages/core-logger/src";
import { Logger } from "./__stubs__/logger";

const manager = new LoggerManager();

describe("Config Manager", () => {
    describe("driver", () => {
        it("should return the driver", async () => {
            await manager.makeDriver(new Logger({}));

            expect(manager.driver()).toBeInstanceOf(AbstractLogger);
        });
    });
});
