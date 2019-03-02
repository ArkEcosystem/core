import { configManager, constants, crypto } from "../../../../packages/crypto/src";
import { transactionBuilder } from "../../../../packages/crypto/src/builder";
import { TransactionRegistry } from "../../../../packages/crypto/src/transactions";
import { TransactionSchema } from "../../../../packages/crypto/src/transactions/types/schemas";
import { AjvWrapper as Ajv } from "../../../../packages/crypto/src/validation";

const { TransactionTypes } = constants;

let transaction;
let transactionSchema: TransactionSchema;

describe("Transfer Transaction", () => {
    const address = "APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi";
    const fee = 1 * constants.ARKTOSHI;
    const amount = 10 * constants.ARKTOSHI;

    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.Transfer).getSchema();
    });

    beforeEach(() => {
        transaction = transactionBuilder.transfer();
    });

    it("should be valid", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("Ahoy")
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with up to 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("a".repeat(64))
            .sign("passphrase");
        let { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee)
            .vendorField("⊁".repeat(21))
            .sign("passphrase");

        error = Ajv.validate(transactionSchema.$id, transaction.getStruct()).error;
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

        let { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(fee);

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.vendorField("⊁".repeat(22));
        transaction.sign("passphrase");

        error = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no address", () => {
        transaction
            .recipientId(null)
            .amount(amount)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to invalid address", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .sign("passphrase");

        const struct = transaction.getStruct();
        struct.recipientId = "woop";

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero amount", () => {
        transaction
            .recipientId(address)
            .amount(0)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(0)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be valid due to missing network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid due to correct network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be invalid due to wrong network byte", () => {
        transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(1)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
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

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
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
        expect(Ajv.validate(transactionSchema.$id, transaction.getStruct()).error).toBeNull();
    });

    it("should be ok and turn uppercase publicKey to lowercase", () => {
        const transfer = transaction
            .recipientId(address)
            .amount(1)
            .fee(1)
            .network(configManager.get("pubKeyHash"))
            .sign("passphrase")
            .build();

        const { senderPublicKey } = transfer.data;

        transfer.data.senderPublicKey = senderPublicKey.toUpperCase();
        expect(transfer.data.senderPublicKey).not.toBe(senderPublicKey);

        const { value, error } = Ajv.validate(transactionSchema.$id, transfer.data);
        expect(error).toBeNull();
        expect(value.senderPublicKey).toBe(senderPublicKey);
    });
});

describe("Second Signature Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.SecondSignature).getSchema();
    });

    beforeEach(() => {
        transaction = transactionBuilder.secondSignature();
    });

    it("should be valid", () => {
        transaction.signatureAsset("second passphrase").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with correct data", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(1 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .signatureAsset("second passphrase")
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(0)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to second signature", () => {
        transaction
            .signatureAsset("second passphrase")
            .fee(1)
            .sign("passphrase")
            .secondSign("second passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });
});

describe("Delegate Registration Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.DelegateRegistration).getSchema();
    });

    beforeEach(() => {
        transaction = transactionBuilder.delegateRegistration();
    });

    it("should be valid", () => {
        transaction.usernameAsset("delegate1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, {});
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .usernameAsset("delegate1")
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to space in username", () => {
        transaction.usernameAsset("test 123").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-alphanumeric in username", () => {
        transaction.usernameAsset("£££").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to username too long", () => {
        transaction.usernameAsset("1234567890123456789012345").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to undefined username", () => {
        transaction.usernameAsset("bla").sign("passphrase");
        const struct = transaction.getStruct();
        struct.asset.delegate.username = undefined;
        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no username", () => {
        transaction.usernameAsset("").sign("passphrase");
        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to capitals in username", () => {
        transaction.usernameAsset("I_AM_INVALID").sign("passphrase");
        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.transfer();
        transaction
            .recipientId(null)
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });
});

describe("Vote Transaction", () => {
    const vote = "+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9";
    const unvote = "-0326580718fc86ba609799ac95fcd2721af259beb5afa81bfce0ab7d9fe95de991";
    const votes = [vote, "+0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0", unvote];
    const invalidVotes = [
        "02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
        "0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0",
        "0326580718fc86ba609799ac95fcd2721af259beb5afa81bfce0ab7d9fe95de991",
    ];

    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.Vote).getSchema();
    });

    beforeEach(() => {
        transaction = transactionBuilder.vote();
    });

    it("should be valid with 1 vote", () => {
        transaction.votesAsset([vote]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with 1 unvote", () => {
        transaction.votesAsset([unvote]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .votesAsset([vote])
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .votesAsset(votes)
            .fee(0)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no votes", () => {
        transaction.votesAsset([]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to more than 1 vote", () => {
        transaction.votesAsset(votes).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to invalid votes", () => {
        transaction.votesAsset(invalidVotes).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong vote type", () => {
        const struct = transaction.sign("passphrase").getStruct();
        struct.asset.votes = vote;

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        const wrongTransaction = transactionBuilder.delegateRegistration();
        wrongTransaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, wrongTransaction.getStruct());
        expect(error).not.toBeNull();
    });
});

describe.skip("Multi Signature Transaction", () => {
    const passphrase = "passphrase 1";
    const publicKey = "+03e8021105a6c202097e97e6c6d650942d913099bf6c9f14a6815df1023dde3b87";
    const passphrases = [passphrase, "passphrase 2", "passphrase 3"];
    const keysGroup = [
        publicKey,
        "+03dfdaaa7fd28bc9359874b7e33138f4d0afe9937e152c59b83a99fae7eeb94899",
        "+03de72ef9d3ebf1b374f1214f5b8dde823690ab2aa32b4b8b3226cc568aaed1562",
    ];

    let multiSignatureAsset;

    beforeAll(() => {
        transactionSchema = TransactionRegistry.get(TransactionTypes.MultiSignature).getSchema();
    });

    beforeEach(() => {
        transaction = transactionBuilder.multiSignature();
        multiSignatureAsset = {
            min: 1,
            keysgroup: keysGroup,
            lifetime: 72,
        };
    });

    const signTransaction = (tx, values) => {
        values.map(value => tx.multiSignatureSign(value));
    };

    it("should be valid with min of 3", () => {
        multiSignatureAsset.min = 3;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with 3 public keys", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be valid with lifetime of 10", () => {
        multiSignatureAsset.lifetime = 10;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeNull();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeNull();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .multiSignatureAsset(multiSignatureAsset)
            .amount(10 * constants.ARKTOSHI)
            .sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to zero fee", () => {
        transaction
            .multiSignatureAsset(multiSignatureAsset)
            .fee(0)
            .sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to min too low", () => {
        multiSignatureAsset.min = 0;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to min too high", () => {
        multiSignatureAsset.min = multiSignatureAsset.keysgroup.length + 1;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to lifetime too low", () => {
        multiSignatureAsset.lifetime = 0;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to lifetime too high", () => {
        multiSignatureAsset.lifetime = 100;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no public keys", () => {
        multiSignatureAsset.keysgroup = [];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
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

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to duplicate public keys", () => {
        multiSignatureAsset.keysgroup = [publicKey, publicKey];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to no signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to not enough signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases.slice(1));

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to too many signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, ["wrong passphrase", ...passphrases]);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it('should be invalid due to no "+" for publicKeys', () => {
        multiSignatureAsset.keysgroup = keysGroup.map(value => value.slice(1));
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it('should be invalid due to having "-" for publicKeys', () => {
        multiSignatureAsset.keysgroup = keysGroup.map(value => `-${value.slice(1)}`);
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong keysgroup type", () => {
        multiSignatureAsset.keysgroup = keysGroup.map(value => value.slice(1));
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const struct = transaction.getStruct();
        struct.asset.multisignature = publicKey;

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeNull();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = transactionBuilder.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeNull();
    });
});
