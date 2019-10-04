import { Interfaces, Managers } from '@arkecosystem/crypto/';
import "../../../../packages/core-jest-matchers/src/transactions/valid-second-signature";
import { TransactionFactory } from '../../../helpers/transaction-factory';

const wallets = [
    {
        address: "AWTRWfm2qdEwxbXnLXxQnviMywFGSHdgkn",
        passphrase: "poet virtual attend winter mushroom near manual dish exact palm siren motion",
        publicKey: "0322bb7969362a15c78b70be2adcfd270a2ad9f2cd0faed14a5d809c7fd5773e48",
    },
    {
        address: "AaWAUV5hgDdUnpWHkD1a65AFQBayGgTaFF",
        passphrase: "obtain flower vital stone song express combine issue used excite despair trash",
        publicKey: "02300c5296527a2ff8586b6d2af383db4e487e6c9a45b6b55dd795393ef460568c",
    },
];

describe(".toHaveValidSecondSignature", () => {
    let transaction: Interfaces.ITransactionData;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");

        transaction = TransactionFactory
            .transfer("AaWAUV5hgDdUnpWHkD1a65AFQBayGgTaFF")
            .withVersion(2)
            .withPassphrase("poet virtual attend winter mushroom near manual dish exact palm siren motion")
            .withSecondPassphrase("obtain flower vital stone song express combine issue used excite despair trash")
            .createOne();
    });

    test("passes when given a valid transaction", () => {
        expect(transaction).toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });

    test("fails when given an invalid transaction", () => {
        transaction.secondSignature = "invalid";
        transaction.signSignature = "invalid";
        expect(expect(transaction).toHaveValidSecondSignature).toThrowError(
            "Expected value to have a valid second signature",
        );
    });

    test("fails when it does not match", () => {
        transaction.secondSignature = "invalid";
        transaction.signSignature = "invalid";
        expect(transaction).not.toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });
});
