import "jest-extended";

import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { configManager, feeManager } from "../../../../../../packages/crypto/src/managers";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions/builders";
import { DelegateResignationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";

let builder: DelegateResignationBuilder;

beforeEach(() => {
    builder = BuilderFactory.delegateResignation();

    configManager.getMilestone().aip11 = true;
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
            expect(builder).toHaveProperty("data.type", TransactionTypes.DelegateResignation);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.DelegateResignation));
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });
});
