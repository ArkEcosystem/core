import "jest-extended";
import { startForger, startRelay } from "../../src/commands";
import { opts, version } from "../__support__/app";

describe("Commands - Start Forger", () => {
    it("should be a function", () => {
        expect(startForger).toBeFunction();
    });

    it.skip("should be OK", async () => {
        const relay = await startRelay(opts, version);
        const forger = await startForger(opts, version);

        expect(relay.isReady).toBeTrue();
        expect(forger.isReady).toBeTrue();

        await forger.tearDown();
        await relay.tearDown();

        expect(forger.isReady).toBeFalse();
        expect(relay.isReady).toBeFalse();
    });
});
