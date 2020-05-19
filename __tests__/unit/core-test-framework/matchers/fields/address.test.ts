import "@packages/core-test-framework/src/matchers/fields/address";

import { CryptoSuite } from "@packages/core-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let address: string;

let Identities;

beforeEach(() => {
    const crypto = new CryptoSuite.CryptoSuite();
    Identities = crypto.CryptoManager.Identities;
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
