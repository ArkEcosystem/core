import { CryptoSuite } from "@packages/core-crypto";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";

import {
    dummy,
    getTimeStampForBlock,
    makeOptionsDefault,
    makeTransactions,
} from "../__utils__/create-block-with-transactions";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = false;

describe("Methods -> BIP39", () => {
    it("should be ok with a plain text passphrase", () => {
        const delegate = new BIP39(crypto.CryptoManager, crypto.BlockFactory, passphrase);

        expect(delegate.publicKey).toBe(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase));
    });

    describe("forge", () => {
        it("should forge a block", () => {
            const delegate: BIP39 = new BIP39(crypto.CryptoManager, crypto.BlockFactory, dummy.plainPassphrase);

            const transactions = makeTransactions(crypto);

            const block = delegate.forge(transactions, makeOptionsDefault(crypto), getTimeStampForBlock);

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
