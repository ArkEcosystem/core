import delay from "delay";
import "jest-extended";
import { RelayProcess } from "../../../src/commands/processes/relay";
import { opts } from "../../__support__/app";

describe("Commands - Start Relay", () => {
    it("should be OK", async () => {
        const handler = new RelayProcess(opts);
        const app = await handler.start();

        expect(app.isReady).toBeTrue();

        await app.tearDown();

        expect(app.isReady).toBeFalse();
    });
});
