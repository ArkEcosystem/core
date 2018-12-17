import "jest-extended";
import { start } from "../../../src/commands/processes/core";
import { opts } from "../../__support__/app";

describe.skip("Commands - Start Relay & Forger", () => {
    it("should be OK", async () => {
        const app = await start(opts);

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
