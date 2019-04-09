import "jest-extended";
import { client, Client } from "../../../packages/crypto/src/client";
import { configManager, feeManager } from "../../../packages/crypto/src/managers";
import { BuilderFactory } from "../../../packages/crypto/src/transactions";

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
        expect(client.getBuilder()).toBe(BuilderFactory);
    });
});
