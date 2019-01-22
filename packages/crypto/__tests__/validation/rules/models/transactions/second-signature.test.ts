import "jest-extended";

import { secondSignature } from "../../../../../src/validation/rules/models/transactions/second-signature";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import {
    amountZeroTests,
    blockidTests,
    confirmationsTests,
    feeTests,
    idTests,
    senderIdTests,
    senderPublicKeyTests,
    signaturesTests,
    signatureTests,
    timestampTests,
} from "./common";

// the base delegate registration we will use all along
const validSecondSignature = client
    .getBuilder()
    .secondSignature()
    .signatureAsset("signature")
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField => secondSignature(Object.assign({}, validSecondSignature, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validSecondSignatureCopy = JSON.parse(JSON.stringify(validSecondSignature));
    delete validSecondSignatureCopy[removedField];
    return secondSignature(validSecondSignatureCopy).passes;
};

describe("validate - id", () => {
    idTests(secondSignature, validSecondSignature);
});

describe("validate - blockid", () => {
    blockidTests(secondSignature, validSecondSignature);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.SecondSignature)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.SecondSignature) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(secondSignature, validSecondSignature);
});

describe("validate - amount", () => {
    amountZeroTests(secondSignature, validSecondSignature);
});

describe("validate - fee", () => {
    feeTests(secondSignature, validSecondSignature);
});

describe("validate - senderId", () => {
    senderIdTests(secondSignature, validSecondSignature);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(secondSignature, validSecondSignature);
});

describe("validate - signature", () => {
    signatureTests(secondSignature, validSecondSignature);
});

describe("validate - signatures", () => {
    signaturesTests(secondSignature, validSecondSignature);
});

describe("validate - secondSignature", () => {
    it("should validate if asset is missing", () => {
        expect(validationPassedRemovingOneField("secondSignature")).toBeTrue();
    });
});

describe("validate - asset > signature > publicKey", () => {
    const publicKeyValidationPassed = publicKey => {
        const asset = JSON.parse(JSON.stringify(validSecondSignature.asset));
        asset.signature.publicKey = publicKey;
        return validationPassed({ asset });
    };
    it("should validate a 66 characters hex string", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E0000000000000000000F00CB4255FE6E000000000000000000000"),
        ).toBeTrue();
    });

    it("shouldn't validate an hex string different than 66 characters", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E000000000000000000F00CB4255FE6E000000000000000000000"),
        ).toBeFalse();
    });

    it("shouldn't validate a non-hex 66 character string", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E0000000000000000000F00CB4255FE6E00000000000000000000g"),
        ).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validSecondSignature.asset));
        delete asset.signature.publicKey;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset > signature", () => {
    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validSecondSignature.asset));
        delete asset.signature;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset", () => {
    const assetValidationPassed = asset => validationPassed({ asset });
    it("shouldn't validate a string", () => {
        expect(assetValidationPassed("asset")).toBeFalse();
    });

    it("shouldn't validate if asset is missing", () => {
        expect(validationPassedRemovingOneField("asset")).toBeFalse();
    });
});

describe("validate - confirmations", () => {
    confirmationsTests(secondSignature, validSecondSignature);
});
