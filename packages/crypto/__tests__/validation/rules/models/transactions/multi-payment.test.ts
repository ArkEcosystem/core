import "jest-extended";

import { multiPayment } from "../../../../../src/validation/rules/models/transactions/multi-payment";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import {
    amountPositiveTests,
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

// the base delegate registration we will use all along
const validMultiPayment = client
    .getBuilder()
    .multiPayment()
    .amount(10000)
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField => multiPayment(Object.assign({}, validMultiPayment, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validMultiPaymentCopy = JSON.parse(JSON.stringify(validMultiPayment));
    delete validMultiPaymentCopy[removedField];
    return multiPayment(validMultiPaymentCopy).passes;
};

describe("validate - id", () => {
    idTests(multiPayment, validMultiPayment);
});

describe("validate - blockid", () => {
    blockidTests(multiPayment, validMultiPayment);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.MultiPayment)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.MultiPayment) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(multiPayment, validMultiPayment);
});

describe("validate - amount", () => {
    amountPositiveTests(multiPayment, validMultiPayment);
});

describe("validate - fee", () => {
    feeTests(multiPayment, validMultiPayment);
});

describe("validate - senderId", () => {
    senderIdTests(multiPayment, validMultiPayment);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(multiPayment, validMultiPayment);
});

describe("validate - signature", () => {
    signatureTests(multiPayment, validMultiPayment);
});

describe("validate - signatures", () => {
    signaturesTests(multiPayment, validMultiPayment);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(multiPayment, validMultiPayment);
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
    confirmationsTests(multiPayment, validMultiPayment);
});
