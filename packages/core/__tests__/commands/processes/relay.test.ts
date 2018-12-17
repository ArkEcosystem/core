import delay from "delay";
import "jest-extended";
import { start } from "../../../src/commands/processes/relay";
import { opts } from "../../__support__/app";

describe("Commands - Start Relay", () => {
    it("should be OK", async () => {
        const app = await start(opts);

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
