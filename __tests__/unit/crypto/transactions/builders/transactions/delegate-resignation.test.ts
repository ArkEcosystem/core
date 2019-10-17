import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { DelegateResignationTransaction } from "../../../../../../packages/crypto/src/transactions/";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions/builders";
import { DelegateResignationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";

let builder: DelegateResignationBuilder;

beforeEach(() => {
    configManager.setFromPreset("unitnet");

    builder = BuilderFactory.delegateResignation();
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
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", DelegateResignationTransaction.staticFee());
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });
});
