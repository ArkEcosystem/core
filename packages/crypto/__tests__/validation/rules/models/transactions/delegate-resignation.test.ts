import "jest-extended";

import { Bignum } from "../../../../../src";
import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import { delegateResignation } from "../../../../../src/validation/rules/models/transactions/delegate-resignation";
import {
    amountZeroTests,
    blockidTests,
    confirmationsTests,
    feeTests,
    idTests,
    secondSignatureTests,
    senderIdTests,
    senderPublicKeyTests,
    signaturesTests,
    signatureTests,
    timestampTests,
} from "./common";

// the base delegate resignation we will use all along
const validDelegateResignation = client
    .getBuilder()
    .delegateResignation()
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField =>
    delegateResignation(Object.assign({}, validDelegateResignation, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validDelegateResignationCopy = JSON.parse(JSON.stringify(validDelegateResignation));
    delete validDelegateResignationCopy[removedField];
    return delegateResignation(validDelegateResignationCopy).passes;
};

describe("validate - id", () => {
    idTests(delegateResignation, validDelegateResignation);
});

describe("validate - blockid", () => {
    blockidTests(delegateResignation, validDelegateResignation);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.DelegateResignation)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.DelegateResignation) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(delegateResignation, validDelegateResignation);
});

describe("validate - amount", () => {
    amountZeroTests(delegateResignation, validDelegateResignation);
});

describe("validate - fee", () => {
    feeTests(delegateResignation, validDelegateResignation);
});

describe("validate - senderId", () => {
    senderIdTests(delegateResignation, validDelegateResignation);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(delegateResignation, validDelegateResignation);
});

describe("validate - signature", () => {
    signatureTests(delegateResignation, validDelegateResignation);
});

describe("validate - signatures", () => {
    signaturesTests(delegateResignation, validDelegateResignation);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(delegateResignation, validDelegateResignation);
});

describe("validate - asset", () => {
    const assetValidationPassed = asset => validationPassed({ asset });
    it("should validate an object", () => {
        expect(assetValidationPassed({})).toBeTrue();
    });

    it("shouldn't validate a string", () => {
        expect(assetValidationPassed("asset")).toBeFalse();
    });

    it("shouldn't validate if asset is missing", () => {
        expect(validationPassedRemovingOneField("asset")).toBeFalse();
    });
});

describe("validate - confirmations", () => {
    confirmationsTests(delegateResignation, validDelegateResignation);
});
