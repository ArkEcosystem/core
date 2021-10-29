import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { Identities } from "@packages/crypto";

import { dummy, optionsDefault, transactions } from "../__utils__/create-block-with-transactions";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Methods -> BIP39", () => {
    it("should be ok with a plain text passphrase", () => {
        const delegate = new BIP39(passphrase);

        expect(delegate.publicKey).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    describe("forge", () => {
        it("should forge a block", () => {
            const delegate: BIP39 = new BIP39(dummy.plainPassphrase);

            const block = delegate.forge(transactions, optionsDefault);

            expect(block.verification).toEqual({
                containsMultiSignatures: false,
                errors: [],
                verified: true,
            });
            expect(block.transactions).toHaveLength(50);
            expect(block.transactions[0].id).toBe(transactions[0].id);
        });
    });
});
