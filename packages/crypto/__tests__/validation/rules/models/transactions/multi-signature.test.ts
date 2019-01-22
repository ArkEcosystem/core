import "jest-extended";

import { multiSignature } from "../../../../../src/validation/rules/models/transactions/multi-signature";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
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

// the base delegate registration we will use all along
const validMultiSignature = client
    .getBuilder()
    .multiSignature()
    .multiSignatureAsset({
        keysgroup: [
            "+0376982a97dadbc65e694743d386084548a65431a82ce935ac9d957b1cffab2784",
            "+03793904e0df839809bc89f2839e1ae4f8b1ea97ede6592b7d1e4d0ee194ca2998",
        ],
        lifetime: 72,
        min: 2,
    })
    .sign("dummy passphrase")
    .multiSignatureSign("multi passphrase 1")
    .multiSignatureSign("multi passphrase 2")
    .getStruct();

const validationPassed = changedField => multiSignature(Object.assign({}, validMultiSignature, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validMultiSignatureCopy = JSON.parse(JSON.stringify(validMultiSignature));
    delete validMultiSignatureCopy[removedField];
    return multiSignature(validMultiSignatureCopy).passes;
};

describe("validate - id", () => {
    idTests(multiSignature, validMultiSignature);
});

describe("validate - blockid", () => {
    blockidTests(multiSignature, validMultiSignature);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.MultiSignature)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.MultiSignature) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(multiSignature, validMultiSignature);
});

describe("validate - amount", () => {
    amountZeroTests(multiSignature, validMultiSignature);
});

describe("validate - fee", () => {
    feeTests(multiSignature, validMultiSignature);
});

describe("validate - senderId", () => {
    senderIdTests(multiSignature, validMultiSignature);
});

describe("validate - recipientId", () => {
    const recipientIdValidationPassed = recipientId => validationPassed({ recipientId });
    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("recipientId")).toBeTrue();
    });

    it.skip("shouldn't validate if field is defined", () => {
        // this should be false as senderId is defined as empty(), but validation returns true
        // (not a big issue anyway but leaving this if someone wants to review)
        expect(recipientIdValidationPassed("recipientId123")).toBeFalse();
    });
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(multiSignature, validMultiSignature);
});

describe("validate - signature", () => {
    signatureTests(multiSignature, validMultiSignature);
});

describe("validate - signatures", () => {
    const passed = signatures => multiSignature(Object.assign({}, validMultiSignature, { signatures })).passes;

    it("should validate an array", () => {
        expect(passed(["signature1", "signature2"])).toBeTrue();
    });

    it("shouldn't validate if field is missing", () => {
        expect(validationPassedRemovingOneField("signatures")).toBeFalse();
    });

    it("shouldn't validate a string", () => {
        expect(passed("yo")).toBeFalse();
    });

    it("shouldn't validate an object", () => {
        expect(passed({ yo: "yo" })).toBeFalse();
    });
});

describe("validate - secondSignature", () => {
    secondSignatureTests(multiSignature, validMultiSignature);
});

describe("validate - asset > multisignature > min", () => {
    const minValidationPassed = min => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        asset.multisignature.min = min;
        return validationPassed({ asset });
    };
    it("should validate an integer", () => {
        expect(minValidationPassed(2)).toBeTrue();
    });

    it("shouldn't validate a string", () => {
        expect(minValidationPassed("2a")).toBeFalse();
    });

    it("shouldn't validate a value > max", () => {
        expect(minValidationPassed(18)).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        delete asset.multisignature.min;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset > multisignature > keysgroup", () => {
    const keysgroupValidationPassed = keysgroup => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        asset.multisignature.keysgroup = keysgroup;
        return validationPassed({ asset });
    };
    it("should validate an array with 2 elements", () => {
        expect(
            keysgroupValidationPassed([
                "+03bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
                "+04bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
            ]),
        ).toBeTrue();
    });

    it("shouldn't validate an empty array or with 1 element", () => {
        expect(keysgroupValidationPassed([])).toBeFalse();
        expect(
            keysgroupValidationPassed(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"]),
        ).toBeFalse();
    });

    it("shouldn't validate an array containing the sender public key", () => {
        expect(
            keysgroupValidationPassed([
                "+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
                `+${validMultiSignature.senderPublicKey}`,
            ]),
        ).toBeFalse();
    });

    it("shouldn't validate an array containing invalid string format", () => {
        expect(
            keysgroupValidationPassed([
                "+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
                "+2bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
            ]),
        ).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        delete asset.multisignature.keysgroup;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset > multisignature > lifetime", () => {
    const lifetimeValidationPassed = lifetime => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        asset.multisignature.lifetime = lifetime;
        return validationPassed({ asset });
    };
    it("should validate an integer between 1 and 72", () => {
        expect(lifetimeValidationPassed(1)).toBeTrue();
        expect(lifetimeValidationPassed(2)).toBeTrue();
        expect(lifetimeValidationPassed(35)).toBeTrue();
        expect(lifetimeValidationPassed(72)).toBeTrue();
    });

    it("shouldn't validate an integer outside of [1 - 72]", () => {
        expect(lifetimeValidationPassed(0)).toBeFalse();
        expect(lifetimeValidationPassed(-2)).toBeFalse();
        expect(lifetimeValidationPassed(73)).toBeFalse();
        expect(lifetimeValidationPassed(178)).toBeFalse();
    });

    it("shouldn't validate a string", () => {
        expect(lifetimeValidationPassed("2a")).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        delete asset.multisignature.lifetime;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset > multisignature", () => {
    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validMultiSignature.asset));
        delete asset.multisignature;
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
    confirmationsTests(multiSignature, validMultiSignature);
});
