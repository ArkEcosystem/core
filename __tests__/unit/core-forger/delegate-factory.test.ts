import { CryptoSuite } from "@packages/core-crypto";
import { DelegateFactory } from "@packages/core-forger/src/delegate-factory";

const passphrase38: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";
const passphrase39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

describe("DelegateFactory", () => {
    describe("bip38", () => {
        it("should create delegate with a valid bip38 passphrase", () => {
            const delegate = DelegateFactory.fromBIP38(
                bip38,
                "bip38-password",
                crypto.CryptoManager,
                crypto.BlockFactory,
            );

            expect(delegate.publicKey).toBe(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrase38));
            expect(delegate.address).toBe(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase38));
        });

        it("should fail with an invalid passphrase", () => {
            expect(() =>
                DelegateFactory.fromBIP38(bip38, "invalid-password", crypto.CryptoManager, crypto.BlockFactory),
            ).toThrow();
        });

        it("should fail with an invalid bip38", () => {
            expect(() =>
                DelegateFactory.fromBIP38("wrong", "bip38-password", crypto.CryptoManager, crypto.BlockFactory),
            ).toThrow("not bip38");
        });
    });

    describe("bip39", () => {
        it("should be ok with a plain text passphrase", () => {
            const delegate = DelegateFactory.fromBIP39(passphrase39, crypto.CryptoManager, crypto.BlockFactory);

            expect(delegate.publicKey).toBe(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrase39));
            expect(delegate.address).toBe(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase39));
        });

        it("should throw if given a bip38 passphrase", () => {
            expect(() => DelegateFactory.fromBIP39(bip38, crypto.CryptoManager, crypto.BlockFactory)).toThrow(
                "seems to be bip38",
            );
        });
    });
});
