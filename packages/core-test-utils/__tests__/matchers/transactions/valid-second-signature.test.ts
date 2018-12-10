import "../../../src/matchers/transactions/valid-second-signature";

import { generateTransfers, generateWallets } from "../../../src/generators";

const wallets = generateWallets("testnet", 2);
const transaction = generateTransfers("testnet", wallets.map(w => w.passphrase))[0];

describe(".toHaveValidSecondSignature", () => {
    test("passes when given a valid transaction", () => {
        expect(transaction).toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });

    test("fails when given an invalid transaction", () => {
        transaction.secondSignature = "invalid";
        transaction.signSignature = "invalid";

        expect(transaction).not.toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });
});
