import "jest-extended";
import { ForgerProcess, RelayProcess } from "../../../src/commands/processes";
import { opts } from "../../__support__/app";

describe("Commands - Start Forger", () => {
    it("should be OK", async () => {
        const relayHandler = new RelayProcess(opts);
        const forgerHandler = new ForgerProcess(opts);

        const relayApp = await relayHandler.start();
        const forgerApp = await forgerHandler.start();

        expect(relayApp.isReady).toBeTrue();
        expect(forgerApp.isReady).toBeTrue();

        await forgerApp.tearDown();
        await relayApp.tearDown();

        expect(forgerApp.isReady).toBeFalse();
        expect(relayApp.isReady).toBeFalse();
    });
});
