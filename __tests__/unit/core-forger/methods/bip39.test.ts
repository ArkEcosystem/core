import { Identities, Utils } from "@arkecosystem/crypto";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

const dummy = {
    plainPassphrase: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    bip38Passphrase: "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B",
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
};

describe("Methods -> BIP39", () => {
    it("should be ok with a plain text passphrase", () => {
        const delegate = new BIP39(passphrase);

        expect(delegate.publicKey).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    describe("forge", () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: "11111111",
                idHex: "11111111",
                height: 2,
            },
            reward: Utils.BigNumber.make(0),
        };
        const transactions = TransactionFactory.initialize()
            .transfer("DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY", 10)
            .withNetwork("devnet")
            .withPassphrase("super cool passphrase")
            .create(50);

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
