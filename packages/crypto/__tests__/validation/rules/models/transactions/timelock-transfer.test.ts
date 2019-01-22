import "jest-extended";

import { timelockTransfer } from "../../../../../src/validation/rules/models/transactions/timelock-transfer";

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
const validTimelockTransfer = client
    .getBuilder()
    .timelockTransfer()
    .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
    .amount(10000)
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField =>
    timelockTransfer(Object.assign({}, validTimelockTransfer, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validTimelockTransferCopy = JSON.parse(JSON.stringify(validTimelockTransfer));
    delete validTimelockTransferCopy[removedField];
    return timelockTransfer(validTimelockTransferCopy).passes;
};

describe("validate - id", () => {
    idTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - blockid", () => {
    blockidTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.TimelockTransfer)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.TimelockTransfer) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - amount", () => {
    amountPositiveTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - fee", () => {
    feeTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - senderId", () => {
    senderIdTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - recipientId", () => {
    recipientIdRequiredTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - signature", () => {
    signatureTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - signatures", () => {
    signaturesTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(timelockTransfer, validTimelockTransfer);
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

describe("validate - vendorField", () => {
    vendorFieldTests(timelockTransfer, validTimelockTransfer);
});

describe("validate - confirmations", () => {
    confirmationsTests(timelockTransfer, validTimelockTransfer);
});
