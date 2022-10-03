import "jest-extended";

import { Application, Container, Exceptions } from "@packages/core-kernel";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { MultiSignatureVerification } from "@packages/core-transactions/src/verification";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

describe("MultiSignatureVerificationMemoized", () => {
    let transaction: Interfaces.ITransaction;
    let multiSignatureAsset: Interfaces.IMultiSignatureAsset;

    let app: Application;
    let verification: MultiSignatureVerification;

    const createTransaction = (amount: string) => {
        return BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount(amount)
            .sign(passphrases[0])
            .build();
    };

    beforeEach(() => {
        transaction = createTransaction("1");
        multiSignatureAsset = {
            min: 2,
            publicKeys: ["publicKeys1", "publicKeys2"],
        };

        app = new Application(new Container.Container());

        verification = app.resolve(MultiSignatureVerification);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("verifySignatures", () => {
        it("should call verifySignatures", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

            verification.verifySignatures(transaction.data, multiSignatureAsset);

            expect(spyOnVerifier).toBeCalledWith(transaction.data, multiSignatureAsset);
        });
    });

    describe("clear", () => {
        it("should throw error", () => {
            expect(() => verification.clear(transaction.data.id)).toThrowError(Exceptions.Runtime.NotImplemented);
        });
    });
});
