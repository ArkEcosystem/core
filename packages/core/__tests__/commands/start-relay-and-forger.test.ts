import "jest-extended";
import { startRelayAndForger } from "../../src/commands";
import { opts, version } from "../__support__/app";

describe.skip("Commands - Start Relay & Forger", () => {
    it("should be OK", async () => {
        const app = await startRelayAndForger(opts, version);

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
