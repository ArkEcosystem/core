import "jest-extended";
import delay from "delay";
import { startRelay } from "../../src/commands";
import { opts, version } from "../__support__/app";

describe("Commands - Start Relay", () => {
    it("should be a function", () => {
        expect(startRelay).toBeFunction();
    });

    it.skip("should be OK", async () => {
        const app = await startRelay(opts, version);

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
