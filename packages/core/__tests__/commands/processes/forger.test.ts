import "jest-extended";
import { forger, relay } from "../../../src/commands/processes";
import { opts } from "../../__support__/app";

describe.skip("Commands - Start Forger", () => {
    it("should be OK", async () => {
        const relayApp = await relay.start(opts);
        const forgerApp = await forger.start(opts);

        expect(relayApp.isReady).toBeTrue();
        expect(forgerApp.isReady).toBeTrue();

        await forgerApp.tearDown();
        await relayApp.tearDown();

        expect(forgerApp.isReady).toBeFalse();
        expect(relayApp.isReady).toBeFalse();
    });
});
