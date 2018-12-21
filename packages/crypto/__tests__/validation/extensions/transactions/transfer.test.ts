import Joi from "joi";
import { configManager, constants, transactionBuilder } from "../../../../src";
import { extensions } from "../../../../src/validation/extensions";

const validator = Joi.extend(extensions);

const address = "APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi";
const fee = 1 * constants.ARKTOSHI;
const amount = 10 * constants.ARKTOSHI;

let transaction;
beforeEach(() => {
    transaction = transactionBuilder.transfer();
});

describe("Transfer Transaction", () => {
    it("should be valid", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("Ahoy")
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();
    });

    it("should be valid with up to 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("a".repeat(64))
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("⊁".repeat(21))
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();
    });

    it("should be invalid with more than 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.data.vendorField = "a".repeat(65);
        transaction.sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.vendorField("⊁".repeat(22));
        transaction.sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        expect(validator.validate("test", validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to no address", () => {
        transaction
            .recipientId(null)
            .amount(amount)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to invalid address", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");
        const struct = transaction.getStruct();
        struct.recipientId = "woop";
        expect(validator.validate(struct, validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to zero amount", () => {
        transaction
            .recipientId(address)
            .amount(0)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(0)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
    });

    it("should be valid due to missing network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();
    });

    it("should be valid due to correct network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).toBeNull();
    });

    it("should be invalid due to wrong network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(1)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.arkTransfer()).error).not.toBeNull();
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
        expect(validator.validate(transfer.data, validator.arkTransfer()).error).toBeNull();

        configManager.setFromPreset("mainnet");

        transfer = transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(23);
        expect(validator.validate(transfer.data, validator.arkTransfer()).error).toBeNull();
    });
});
