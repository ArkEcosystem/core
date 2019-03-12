import "jest-extended";
import { AbstractLogger, LogManager } from "../../../packages/core-logger/src";
import { Logger } from "./__stubs__/logger";

const manager = new LogManager();

describe("Config Manager", () => {
    describe("driver", () => {
        it("should return the driver", async () => {
            await manager.makeDriver(new Logger({}));

            expect(manager.driver()).toBeInstanceOf(AbstractLogger);
        });
    });
});
