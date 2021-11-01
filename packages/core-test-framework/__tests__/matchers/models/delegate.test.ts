import "@packages/core-test-framework/src/matchers/models/delegate";
import { Identities } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let delegate: any;

beforeEach(() => {
    delegate = {
        address: Identities.Address.fromPassphrase(passphrases[0]),
        publicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
        username: "dummy",
    };
});

describe("Delegate", () => {
    describe("toBeDelegate", () => {
        it("should be delegate", async () => {
            expect(delegate).toBeDelegate();
        });

        it("should not be delegate -  additional field", async () => {
            delegate.test = {};
            expect(delegate).not.toBeDelegate();
        });

        it("should not be delegate - missing field", async () => {
            delete delegate.username;
            expect(delegate).not.toBeDelegate();
        });
    });
});
