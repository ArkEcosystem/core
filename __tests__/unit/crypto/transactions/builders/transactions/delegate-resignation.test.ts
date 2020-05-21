import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";

import * as Generators from "../../../../../../packages/core-test-framework/src/app/generators";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { DelegateResignationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { Two } from "../../../../../../packages/crypto/src/transactions/types";

let crypto: CryptoManager<any>;
let builder: DelegateResignationBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionManager<any, Interfaces.ITransactionData, any>;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());
    crypto.HeightTracker.setHeight(2);

    transactionsManager = new Transactions.TransactionManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.delegateResignation();
});

describe("Delegate Resignation Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder.sign("dummy passphrase").secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionType.DelegateResignation);
            expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", Two.DelegateResignationTransaction.staticFee(crypto));
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });
});
