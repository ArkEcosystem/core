import "jest-extended";
import { transactionBuilder } from "../src/builder";
import { client, Client } from "../src/client";
import { configManager, feeManager } from "../src/managers";

describe("Client", () => {
    it("should be instantiated", () => {
        expect(client).toBeInstanceOf(Client);
    });

    it("should getFeeManager()", () => {
        expect(client.getFeeManager()).toBe(feeManager);
    });

    it("should getConfigManager()", () => {
        expect(client.getConfigManager()).toBe(configManager);
    });

    it("should getBuilder()", () => {
        expect(client.getBuilder()).toBe(transactionBuilder);
    });
});
