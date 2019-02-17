// tslint:disable:no-empty

import Joi from "joi";
import { constants, crypto, transactionBuilder } from "../../../../src";
import { extensions } from "../../../../src/validation/extensions";

const validator = Joi.extend(extensions);

const passphrase = "passphrase 1";
const publicKey = "+03e8021105a6c202097e97e6c6d650942d913099bf6c9f14a6815df1023dde3b87";
const passphrases = [passphrase, "passphrase 2", "passphrase 3"];
const keysGroup = [
    publicKey,
    "+03dfdaaa7fd28bc9359874b7e33138f4d0afe9937e152c59b83a99fae7eeb94899",
    "+03de72ef9d3ebf1b374f1214f5b8dde823690ab2aa32b4b8b3226cc568aaed1562",
];

const signTransaction = (tx, values) => {
    values.map(value => tx.multiSignatureSign(value));
};

let transaction;
let multiSignatureAsset;
beforeEach(() => {
    transaction = transactionBuilder.multiSignature();
    multiSignatureAsset = {
        min: 1,
        keysgroup: keysGroup,
        lifetime: 72,
    };
});

describe("Multi Signature Transaction", () => {
    it("should be valid with min of 3", () => {
        multiSignatureAsset.min = 3;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).toBeNull();
    });

    it("should be valid with 3 public keys", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).toBeNull();
    });

    it("should be valid with lifetime of 10", () => {
        multiSignatureAsset.lifetime = 10;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        expect(validator.validate("test", validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .multiSignatureAsset(multiSignatureAsset)
            .amount(10 * constants.SATOSHI)
            .sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .multiSignatureAsset(multiSignatureAsset)
            .fee(0)
            .sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to min too low", () => {
        multiSignatureAsset.min = 0;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to min too high", () => {
        multiSignatureAsset.min = multiSignatureAsset.keysgroup.length + 1;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to lifetime too low", () => {
        multiSignatureAsset.lifetime = 0;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to lifetime too high", () => {
        multiSignatureAsset.lifetime = 100;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to no public keys", () => {
        multiSignatureAsset.keysgroup = [];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to too many public keys", () => {
        const values = [];
        multiSignatureAsset.keysgroup = [];
        for (let i = 0; i < 20; i++) {
            const value = `passphrase ${i}`;
            values.push(value);
            multiSignatureAsset.keysgroup.push(crypto.getKeys(value).publicKey);
        }
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, values);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to duplicate public keys", () => {
        multiSignatureAsset.keysgroup = [publicKey, publicKey];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to no signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to not enough signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases.slice(1));
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to too many signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, ["wrong passphrase", ...passphrases]);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it('should be invalid due to no "+" for publicKeys', () => {
        multiSignatureAsset.keysgroup = keysGroup.map(value => value.slice(1));
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it('should be invalid due to having "-" for publicKeys', () => {
        multiSignatureAsset.keysgroup = keysGroup.map(value => `-${value.slice(1)}`);
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
    });

    it("should be invalid due to wrong keysgroup type", () => {
        try {
            multiSignatureAsset.keysgroup = publicKey;
            transaction.multiSignatureAsset(publicKey).sign("passphrase");
            signTransaction(transaction, passphrases);
            expect(validator.validate(transaction.getStruct(), validator.multiSignature()).error).not.toBeNull();
        } catch (error) {}
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");
        expect(validator.validate(transaction.getStruct(), validator.multiSignature()).errors).not.toBeNull();
    });
});
