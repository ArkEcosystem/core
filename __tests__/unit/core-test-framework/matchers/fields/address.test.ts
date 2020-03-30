import "@packages/core-test-framework/src/matchers/fields/address";
import { Identities } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let address: string;

beforeEach(() => {
    address = Identities.Address.fromPassphrase(passphrases[0]);
});

describe("Address", () => {
    describe("toBeAddress", () => {
        it("should be valid address", async () => {
            expect(address).toBeAddress();
        });

        it("should not be valid address", async () => {
            address = "invalid_address";
            expect(address).not.toBeAddress();
        });
    });
});
