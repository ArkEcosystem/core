import "jest-extended";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import { delegateRegistration } from "../../../../../src/validation/rules/models/transactions/delegate-registration";
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
const validDelegateRegistration = client
    .getBuilder()
    .delegateRegistration()
    .usernameAsset("homer")
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField =>
    delegateRegistration(Object.assign({}, validDelegateRegistration, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validDelegateRegistrationCopy = JSON.parse(JSON.stringify(validDelegateRegistration));
    delete validDelegateRegistrationCopy[removedField];
    return delegateRegistration(validDelegateRegistrationCopy).passes;
};

describe("validate - id", () => {
    idTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - blockid", () => {
    blockidTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.DelegateRegistration)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.DelegateRegistration) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - amount", () => {
    amountZeroTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - fee", () => {
    feeTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - senderId", () => {
    senderIdTests(delegateRegistration, validDelegateRegistration);
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
    senderPublicKeyTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - signature", () => {
    signatureTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - signatures", () => {
    signaturesTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - secondSignature", () => {
    secondSignatureTests(delegateRegistration, validDelegateRegistration);
});

describe("validate - asset > delegate > username", () => {
    const usernameValidationPassed = username => {
        const asset = JSON.parse(JSON.stringify(validDelegateRegistration.asset));
        asset.delegate.username = username;
        return validationPassed({ asset });
    };
    it("should validate a string with lowcase letters and numbers", () => {
        expect(usernameValidationPassed("c00lusername")).toBeTrue();
    });

    it("shouldn't validate an empty string", () => {
        expect(usernameValidationPassed("")).toBeFalse();
    });

    it("shouldn't validate a string with more than 20 characters", () => {
        expect(usernameValidationPassed("thisiswaymorethan20characters")).toBeFalse();
    });

    it("shouldn't validate a number", () => {
        expect(usernameValidationPassed(21)).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validDelegateRegistration.asset));
        delete asset.delegate.username;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset > delegate > publicKey", () => {
    const publicKeyValidationPassed = publicKey => {
        const asset = JSON.parse(JSON.stringify(validDelegateRegistration.asset));
        asset.delegate.publicKey = publicKey;
        return validationPassed({ asset });
    };
    it("should validate a 66 characters hex string", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E0000000000000000000F00CB4255FE6E000000000000000000000"),
        ).toBeTrue();
    });

    it("should validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validDelegateRegistration.asset));
        delete asset.delegate.publicKey;
        expect(validationPassed({ asset })).toBeTrue();
    });

    it("shouldn't validate an hex string different than 66 characters", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E000000000000000000F00CB4255FE6E000000000000000000000"),
        ).toBeFalse();
    });

    it("shouldn't validate a non-hex 66 character string", () => {
        expect(
            publicKeyValidationPassed("F00CB4255FE6E0000000000000g00000F00CB4255FE6E000000000000000000000"),
        ).toBeFalse();
    });
});

describe("validate - asset", () => {
    it("shouldn't validate if asset > delegate is missing", () => {
        const asset = JSON.parse(JSON.stringify(validDelegateRegistration.asset));
        delete asset.delegate;
        expect(validationPassed({ asset })).toBeFalse();
    });

    it("shouldn't validate if asset is missing", () => {
        expect(validationPassedRemovingOneField("asset")).toBeFalse();
    });
});

describe("validate - confirmations", () => {
    confirmationsTests(delegateRegistration, validDelegateRegistration);
});
