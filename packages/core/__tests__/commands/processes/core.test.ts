import "jest-extended";
import { CoreProcess } from "../../../src/commands/processes/core";
import { opts } from "../../__support__/app";

describe("Commands - Start Relay & Forger", () => {
    it("should be OK", async () => {
        const handler = new CoreProcess(opts);
        const app = await handler.start();

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
