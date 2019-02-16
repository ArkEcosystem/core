// tslint:disable:no-empty

import Joi from "joi";
import { constants, transactionBuilder } from "../../../../src";
import { extensions } from "../../../../src/validation/extensions";

const validator = Joi.extend(extensions);

let transaction;
beforeEach(() => {
    transaction = transactionBuilder.delegateRegistration();
});

describe("Delegate Registration Transaction", () => {
    it("should be valid", () => {
        transaction.usernameAsset("delegate1").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        expect(validator.validate("test", validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .usernameAsset("delegate1")
            .amount(10 * constants.SATOSHI)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to space in username", () => {
        transaction.usernameAsset("test 123").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to non-alphanumeric in username", () => {
        transaction.usernameAsset("£££").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to username too long", () => {
        transaction.usernameAsset("1234567890123456789012345").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to undefined username", () => {
        try {
            transaction.usernameAsset(undefined).sign("passphrase");
            expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
        } catch (error) {}
    });

    it("should be invalid due to no username", () => {
        transaction.usernameAsset("").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to capitals in username", () => {
        transaction.usernameAsset("I_AM_INVALID").sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.transfer();
        transaction
            .recipientId(null)
            .amount(10 * constants.SATOSHI)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.delegateRegistration()).error).not.toBeNull();
    });
});
