import "jest-extended";

import { transfer } from "../../../../../src/validation/rules/models/transactions/transfer";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import {
    amountPositiveTests,
    blockidTests,
    confirmationsTests,
    feeTests,
    idTests,
    recipientIdRequiredTests,
    secondSignatureTests,
    senderIdTests,
    senderPublicKeyTests,
    signaturesTests,
    signatureTests,
    timestampTests,
    vendorFieldTests,
} from "./common";

// the base delegate registration we will use all along
const validTransfer = client
    .getBuilder()
    .transfer()
    .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
    .amount(10000)
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField => transfer(Object.assign({}, validTransfer, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validTransferCopy = JSON.parse(JSON.stringify(validTransfer));
    delete validTransferCopy[removedField];
    return transfer(validTransferCopy).passes;
};

describe("validate - id", () => {
    idTests(transfer, validTransfer);
});

describe("validate - blockid", () => {
    blockidTests(transfer, validTransfer);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.Transfer)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.Transfer) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(transfer, validTransfer);
});

describe("validate - amount", () => {
    amountPositiveTests(transfer, validTransfer);
});

describe("validate - fee", () => {
    feeTests(transfer, validTransfer);
});

describe("validate - senderId", () => {
    senderIdTests(transfer, validTransfer);
});

describe("validate - recipientId", () => {
    recipientIdRequiredTests(transfer, validTransfer);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(transfer, validTransfer);
});

describe("validate - signature", () => {
    signatureTests(transfer, validTransfer);
});

describe("validate - signatures", () => {
    signaturesTests(transfer, validTransfer);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(transfer, validTransfer);
});

describe("validate - vendorField", () => {
    vendorFieldTests(transfer, validTransfer);
});

describe("validate - confirmations", () => {
    confirmationsTests(transfer, validTransfer);
});
