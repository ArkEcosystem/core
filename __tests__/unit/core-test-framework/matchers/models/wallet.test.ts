import "@packages/core-test-framework/src/matchers/models/wallet";
import { Identities } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let wallet: any;

beforeEach(() => {
    wallet = {
        address: Identities.Address.fromPassphrase(passphrases[0]),
        publicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
    };
});

describe("Wallet", () => {
    describe("toBeWallet", () => {
        it("should be wallet", async () => {
            expect(wallet).toBeWallet();
        });

        // TODO: Check why additional fields are not allowed
        it("should not be wallet -  additional field", async () => {
            wallet.test = {};
            expect(wallet).not.toBeWallet();
        });

        it("should not be wallet - missing field", async () => {
            delete wallet.publicKey;
            expect(wallet).not.toBeWallet();
        });
    });
});
