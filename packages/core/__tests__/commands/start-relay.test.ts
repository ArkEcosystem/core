import delay from "delay";
import "jest-extended";
import { startRelay } from "../../src/commands";
import { opts, version } from "../__support__/app";

describe.skip("Commands - Start Relay", () => {
    it("should be OK", async () => {
        const app = await startRelay(opts, version);

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
