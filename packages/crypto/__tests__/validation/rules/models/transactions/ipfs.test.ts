import "jest-extended";

import { ipfs } from "../../../../../src/validation/rules/models/transactions/ipfs";

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
const validIpfs = client
    .getBuilder()
    .ipfs()
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField => ipfs(Object.assign({}, validIpfs, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validIpfsCopy = JSON.parse(JSON.stringify(validIpfs));
    delete validIpfsCopy[removedField];
    return ipfs(validIpfsCopy).passes;
};

describe("validate - id", () => {
    idTests(ipfs, validIpfs);
});

describe("validate - blockid", () => {
    blockidTests(ipfs, validIpfs);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.Ipfs)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.Ipfs) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(ipfs, validIpfs);
});

describe("validate - amount", () => {
    amountPositiveTests(ipfs, validIpfs);
});

describe("validate - fee", () => {
    feeTests(ipfs, validIpfs);
});

describe("validate - senderId", () => {
    senderIdTests(ipfs, validIpfs);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(ipfs, validIpfs);
});

describe("validate - signature", () => {
    signatureTests(ipfs, validIpfs);
});

describe("validate - signatures", () => {
    signaturesTests(ipfs, validIpfs);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(ipfs, validIpfs);
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
    confirmationsTests(ipfs, validIpfs);
});
