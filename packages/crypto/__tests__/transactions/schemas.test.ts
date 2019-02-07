import { configManager, constants } from "../../src";
import { transactionBuilder } from "../../src/builder";
import { TransactionRegistry } from "../../src/transactions";
import { ITransactionSchema } from "../../src/transactions/interfaces";
import { joiWrapper } from "../../src/validation/joi-wrapper";

const { TransactionTypes } = constants;

let transaction;
let transactionSchema: ITransactionSchema;
let joi;

beforeAll(() => {
    joi = joiWrapper.instance();
});

describe("Transfer Transaction", () => {
    const address = "APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi";
    const fee = 1 * constants.ARKTOSHI;
    const amount = 10 * constants.ARKTOSHI;

    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.Transfer).getSchema().base;
    });

    beforeEach(() => {
        transaction = transactionBuilder.transfer();
    });

    it("should be valid", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("Ahoy")
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();
    });

    it("should be valid with up to 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("a".repeat(64))
            .sign("passphrase");
        let { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("⊁".repeat(21))
            .sign("passphrase");

        error = joi.validate(transaction.getStruct(), transactionSchema).error;
        expect(error).toBeNull();
    });

    it("should be invalid with more than 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.data.vendorField = "a".repeat(65);
        transaction.sign("passphrase");

        let { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.vendorField("⊁".repeat(22));
        transaction.sign("passphrase");

        error = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = joi.validate("test", transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no address", () => {
        transaction
            .recipientId(null)
            .amount(amount)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to invalid address", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");

        const struct = transaction.getStruct();
        struct.recipientId = "woop";

        const { error } = joi.validate(struct, transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero amount", () => {
        transaction
            .recipientId(address)
            .amount(0)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(0)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be valid due to missing network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();
    });

    it("should be valid due to correct network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();
    });

    it("should be invalid due to wrong network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(1)
            .sign("passphrase");

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).not.toBeNull();
    });

    it("should be valid after a network change", () => {
        configManager.setFromPreset("devnet");

        let transfer = transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(30);

        const { error } = joi.validate(transaction.getStruct(), transactionSchema);
        expect(error).toBeNull();

        configManager.setFromPreset("mainnet");

        transfer = transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(23);
        expect(joi.validate(transaction.getStruct(), transactionSchema).error).toBeNull();
    });
});

describe("Delegate Registration Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.DelegateRegistration).getSchema().base;
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
