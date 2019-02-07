import { constants } from "../../src";
import { transactionBuilder } from "../../src/builder";
import { TransactionRegistry } from "../../src/transactions";
import { ITransactionSchema } from "../../src/transactions/interfaces";
import { joiWrapper } from "../../src/validation/joi-wrapper";

const { TransactionTypes } = constants;

let transaction;
let transactionSchema: ITransactionSchema;
let joi;

describe("Delegate Registration Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.DelegateRegistration).getSchema().base;
        joi = joiWrapper.instance();
    });

    beforeEach(() => {
        transaction = transactionBuilder.delegateRegistration();
    });

    it("should be valid", () => {
        transaction.usernameAsset("delegate1").sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = joi.validate({}, transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .usernameAsset("delegate1")
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to space in username", () => {
        transaction.usernameAsset("test 123").sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-alphanumeric in username", () => {
        transaction.usernameAsset("£££").sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to username too long", () => {
        transaction.usernameAsset("1234567890123456789012345").sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to undefined username", () => {
        transaction.usernameAsset("bla").sign("passphrase");
        const struct = transaction.getStruct();
        struct.asset.delegate.username = undefined;
        const { error } = joi.validate(struct, transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no username", () => {
        transaction.usernameAsset("").sign("passphrase");
        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to capitals in username", () => {
        transaction.usernameAsset("I_AM_INVALID").sign("passphrase");
        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.transfer();
        transaction
            .recipientId(null)
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });
});
