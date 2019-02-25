import Joi from "joi";
import { constants, transactionBuilder } from "../../../../../../packages/crypto/src";
import { extensions } from "../../../../../../packages/crypto/src/validation/extensions";

const validator = Joi.extend(extensions);

let transaction;
beforeEach(() => {
    transaction = transactionBuilder.secondSignature();
});

// NOTE: some tests aren't strictly about the second signature

describe("Second Signature Transaction", () => {
    it("should be valid", () => {
        transaction.signatureAsset("second passphrase").sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature()).error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(1 * constants.SATOSHI)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature()).error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        expect(validator.validate("test", validator.secondSignature()).error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .signatureAsset("second passphrase")
            .amount(10 * constants.SATOSHI)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature()).error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(0)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature()).error).not.toBeNull();
    });

    it("should be invalid due to second signature", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(1)
            .sign("passphrase")
            .secondSign("second passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature())).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.secondSignature()).error).not.toBeNull();
    });
});
