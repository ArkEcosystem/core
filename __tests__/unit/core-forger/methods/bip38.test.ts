import { CryptoSuite } from "@packages/core-crypto";
import { BIP38 } from "@packages/core-forger/src/methods/bip38";

import {
    dummy,
    getTimeStampForBlock,
    makeExpectedBlock,
    makeOptionsDefault,
    makeTransactions,
} from "../__utils__/create-block-with-transactions";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = false;

describe("Methods -> BIP38", () => {
    it("should pass with a valid passphrase", () => {
        const delegate = new BIP38(crypto.CryptoManager, crypto.BlockFactory, bip38, "bip38-password");

        expect(delegate.publicKey).toBe(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase));
    });

    it("should fail with an invalid passphrase", () => {
        expect(() => new BIP38(crypto.CryptoManager, crypto.BlockFactory, bip38, "invalid-password")).toThrow();
    });

    it("should forge a block - bip38", () => {
        const delegate = new BIP38(crypto.CryptoManager, crypto.BlockFactory, dummy.bip38Passphrase, "bip38-password");

        const spyDecryptKeys = jest.spyOn(delegate as any, "decryptKeysWithOtp");
        const spyEncryptKeys = jest.spyOn(delegate as any, "encryptKeysWithOtp");

        const transactions = makeTransactions(crypto);

        const block = delegate.forge(transactions, makeOptionsDefault(crypto), getTimeStampForBlock);

        expect(spyDecryptKeys).toHaveBeenCalledTimes(1);
        expect(spyEncryptKeys).toHaveBeenCalledTimes(1);

        for (const key of Object.keys(makeExpectedBlock(crypto))) {
            expect(block.data[key]).toEqual(makeExpectedBlock(crypto)[key]);
        }
        expect(block.verification).toEqual({
            containsMultiSignatures: false,
            errors: [],
            verified: true,
        });
        expect(block.transactions).toHaveLength(50);
        expect(block.transactions[0].id).toBe(transactions[0].id);
    });

    it("should not forge a block if encryptedKeys are not set", () => {
        const delegate = new BIP38(crypto.CryptoManager, crypto.BlockFactory, dummy.bip38Passphrase, "bip38-password");
        delegate.encryptedKeys = undefined;

        expect(() =>
            delegate.forge(makeTransactions(crypto), makeOptionsDefault(crypto), getTimeStampForBlock),
        ).toThrow();
    });
});
