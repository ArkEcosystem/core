import Joi from "joi";
import { configManager, constants, transactionBuilder } from "../../../../../../packages/crypto/src";
import { extensions } from "../../../../../../packages/crypto/src/validation/extensions";

const validator = Joi.extend(extensions);

const address = "APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi";
const fee = 1 * constants.SATOSHI;
const amount = 10 * constants.SATOSHI;

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
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("Ahoy")
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();
    });

    it("should be valid with up to 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("a".repeat(64))
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("⊁".repeat(21))
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();
    });

    it("should be invalid with more than 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.data.vendorField = "a".repeat(65);
        transaction.sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.vendorField("⊁".repeat(22));
        transaction.sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        expect(validator.validate("test", validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to no address", () => {
        transaction
            .recipientId(null)
            .amount(amount)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to invalid address", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");
        const struct = transaction.getStruct();
        struct.recipientId = "woop";
        expect(validator.validate(struct, validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to zero amount", () => {
        transaction
            .recipientId(address)
            .amount(0)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(0)
            .sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
    });

    it("should be valid due to missing network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();
    });

    it("should be valid due to correct network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).toBeNull();
    });

    it("should be invalid due to wrong network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(1)
            .sign("passphrase");

        expect(validator.validate(transaction.getStruct(), validator.transfer()).error).not.toBeNull();
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
        expect(validator.validate(transfer.data, validator.transfer()).error).toBeNull();

        configManager.setFromPreset("mainnet");

        transfer = transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(23);
        expect(validator.validate(transfer.data, validator.transfer()).error).toBeNull();
    });
});
