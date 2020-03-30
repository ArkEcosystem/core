import { Generators } from "@packages/core-test-framework/src";

import { ARKTOSHI } from "../../../../packages/crypto/src/constants";
import { HtlcLockExpirationType, TransactionType, TransactionTypeGroup } from "../../../../packages/crypto/src/enums";
import { PublicKey } from "../../../../packages/crypto/src/identities";
import { Utils } from "../../../../packages/crypto/src/index";
import { IMultiSignatureAsset } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import { BuilderFactory } from "../../../../packages/crypto/src/transactions";
import { TransactionTypeFactory } from "../../../../packages/crypto/src/transactions";
import { schemas } from "../../../../packages/crypto/src/transactions/types";
import { TransactionSchema } from "../../../../packages/crypto/src/transactions/types/schemas";
import { validator as Ajv } from "../../../../packages/crypto/src/validation";
import { htlcSecretHex } from "./__fixtures__/htlc";

let transaction;
let transactionSchema: TransactionSchema;

describe("Transfer Transaction", () => {
    const address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
    const fee = 1 * ARKTOSHI;
    const amount = 10 * ARKTOSHI;

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.Transfer).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.transfer();
    });

    it("should be valid", () => {
        transaction.recipientId(address).amount(amount).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with correct data", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(Utils.BigNumber.make(fee).toFixed())
            .vendorField("Ahoy")
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with up to 64 bytes in vendor field", () => {
        transaction
            .recipientId(address)
            .amount(amount)
            .fee(Utils.BigNumber.make(fee).toFixed())
            .vendorField("a".repeat(64))
            .sign("passphrase");
        let { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();

        transaction
            .recipientId(address)
            .amount(amount)
            .fee(Utils.BigNumber.make(fee).toFixed())
            .vendorField("⊁".repeat(21))
            .sign("passphrase");

        error = Ajv.validate(transactionSchema.$id, transaction.getStruct()).error;
        expect(error).toBeUndefined();
    });

    it("should be invalid with more than 64 bytes in vendor field", () => {
        transaction.recipientId(address).amount(amount).fee(Utils.BigNumber.make(fee).toFixed());

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.data.vendorField = "a".repeat(65);
        transaction.sign("passphrase");

        let { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();

        transaction.recipientId(address).amount(amount).fee(Utils.BigNumber.make(fee).toFixed());

        // Bypass vendorfield check by manually assigning a vendorfield > 64 bytes
        transaction.data.vendorField = "⊁".repeat(22);
        transaction.sign("passphrase");

        error = Ajv.validate(transactionSchema.$id, transaction.data);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no address", () => {
        transaction.recipientId(undefined).amount(amount).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to invalid address", () => {
        transaction.recipientId(address).amount(amount).sign("passphrase");

        const struct = transaction.getStruct();
        struct.recipientId = "woop";

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero amount", () => {
        transaction.recipientId(address).amount(0).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.recipientId(address).amount("1").fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be valid due to missing network byte", () => {
        transaction.recipientId(address).amount("1").fee("1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid due to correct network byte", () => {
        transaction
            .recipientId(address)
            .amount("1")
            .fee("1")
            .network(configManager.get("network.pubKeyHash"))
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid due to wrong network byte", () => {
        transaction.recipientId(address).amount("1").fee("1").network(1).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be valid after a network change", () => {
        configManager.setFromPreset("devnet");

        let transfer = transaction
            .recipientId(address)
            .amount("1")
            .fee("1")
            .network(configManager.get("network.pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(30);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();

        configManager.setFromPreset("mainnet");

        transfer = transaction
            .recipientId("APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi")
            .amount("1")
            .fee("1")
            .network(configManager.get("network.pubKeyHash"))
            .sign("passphrase")
            .build();

        expect(transfer.data.network).toBe(23);
        expect(Ajv.validate(transactionSchema.$id, transaction.getStruct()).error).toBeUndefined();

        configManager.setFromPreset("devnet");
    });

    it("should be ok and turn uppercase publicKey to lowercase", () => {
        const transfer = transaction
            .recipientId(address)
            .amount("1")
            .fee("1")
            .network(configManager.get("network.pubKeyHash"))
            .sign("passphrase")
            .build();

        const { senderPublicKey } = transfer.data;

        transfer.data.senderPublicKey = senderPublicKey.toUpperCase();
        expect(transfer.data.senderPublicKey).not.toBe(senderPublicKey);

        const { value, error } = Ajv.validate(transactionSchema.$id, transfer.data);
        expect(error).toBeUndefined();
        expect(value.senderPublicKey).toBe(senderPublicKey);
    });
});

describe("Second Signature Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.SecondSignature).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.secondSignature();
    });

    it("should be valid", () => {
        transaction.signatureAsset("second passphrase").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with correct data", () => {
        transaction.signatureAsset("second passphrase").fee("100000000").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction.signatureAsset("second passphrase").amount("1000000000").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.signatureAsset("second passphrase").fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to second signature", () => {
        transaction.signatureAsset("second passphrase").fee("1").sign("passphrase").secondSign("second passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});

describe("Delegate Registration Transaction", () => {
    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.DelegateRegistration).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.delegateRegistration();
    });

    it("should be valid", () => {
        transaction.usernameAsset("delegate1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, {});
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .usernameAsset("delegate1")
            .amount(10 * ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.usernameAsset("delegate1").fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to space in username", () => {
        transaction.usernameAsset("test 123").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-alphanumeric in username", () => {
        transaction.usernameAsset("£££").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to username too long", () => {
        transaction.usernameAsset("1234567890123456789012345").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to undefined username", () => {
        transaction.usernameAsset("bla").sign("passphrase");
        const struct = transaction.getStruct();
        struct.asset.delegate.username = undefined;
        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no username", () => {
        transaction.usernameAsset("").sign("passphrase");
        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to capitals in username", () => {
        transaction.usernameAsset("I_AM_INVALID").sign("passphrase");
        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.transfer();
        transaction
            .recipientId(undefined)
            .amount(10 * ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
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
        transactionSchema = TransactionTypeFactory.get(TransactionType.Vote).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.vote();
    });

    it("should be valid with 1 vote", () => {
        transaction.votesAsset([vote]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with 1 unvote", () => {
        transaction.votesAsset([unvote]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .votesAsset([vote])
            .amount(10 * ARKTOSHI)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.votesAsset(votes).fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no votes", () => {
        transaction.votesAsset([]).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to more than 1 vote", () => {
        transaction.votesAsset(votes).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to invalid votes", () => {
        transaction.votesAsset(invalidVotes).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong vote type", () => {
        const struct = transaction.sign("passphrase").getStruct();
        struct.asset.votes = vote;

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        const wrongTransaction = BuilderFactory.delegateRegistration();
        wrongTransaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, wrongTransaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});

describe("Multi Signature Registration Transaction", () => {
    const passphrase = "passphrase 1";
    const publicKey = "03e8021105a6c202097e97e6c6d650942d913099bf6c9f14a6815df1023dde3b87";
    const passphrases = [passphrase, "passphrase 2", "passphrase 3"];
    const participants = [
        publicKey,
        "03dfdaaa7fd28bc9359874b7e33138f4d0afe9937e152c59b83a99fae7eeb94899",
        "03de72ef9d3ebf1b374f1214f5b8dde823690ab2aa32b4b8b3226cc568aaed1562",
    ];

    let multiSignatureAsset: IMultiSignatureAsset;

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(
            TransactionType.MultiSignature,
            TransactionTypeGroup.Core,
            2,
        ).getSchema();
    });

    beforeEach(() => {
        // todo: completely wrap this into a function to hide the generation and setting of the config?
        configManager.setConfig(Generators.generateCryptoConfigRaw());

        transaction = BuilderFactory.multiSignature();
        multiSignatureAsset = {
            min: 3,
            publicKeys: participants,
        };
    });

    afterEach(() => {
        configManager.setFromPreset("devnet");
    });

    const signTransaction = (tx, values) => {
        values.map((value, index) => tx.multiSign(value, index));
    };

    it("should be valid with min of 3", () => {
        multiSignatureAsset.min = 3;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with 3 public keys", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be valid with a dynamic number of signatures between min and publicKeys ", () => {
        multiSignatureAsset.min = 1;
        for (const count of [1, 2, 3]) {
            transaction.data.signatures = [];
            transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
            signTransaction(transaction, passphrases.slice(0, count));

            const struct = transaction.getStruct();
            const { error } = Ajv.validate(transactionSchema.$id, struct);
            expect(error).toBeUndefined();
        }
    });

    it("should be invalid due to no transaction as object", () => {
        const { error } = Ajv.validate(transactionSchema.$id, "test");
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction
            .multiSignatureAsset(multiSignatureAsset)
            .amount(10 * ARKTOSHI)
            .sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).fee("0").sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to min too low", () => {
        multiSignatureAsset.min = 0;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to min too high", () => {
        multiSignatureAsset.min = multiSignatureAsset.publicKeys.length + 1;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no public keys", () => {
        multiSignatureAsset.publicKeys = [];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to too many public keys", () => {
        const values = [];
        multiSignatureAsset.publicKeys = [];
        for (let i = 0; i < 20; i++) {
            const value = `passphrase ${i}`;
            values.push(value);
            multiSignatureAsset.publicKeys.push(PublicKey.fromPassphrase(value));
        }

        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, values);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to duplicate public keys", () => {
        multiSignatureAsset.publicKeys = [publicKey, publicKey];
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to empty signatures", () => {
        multiSignatureAsset.min = 1;
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, []);

        const struct = transaction.getStruct();
        struct.signatures = [];
        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to not enough signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases.slice(1));

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to too many signatures", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, ["wrong passphrase", ...passphrases]);

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to too few publicKeys", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const struct = transaction.getStruct();
        struct.asset.multiSignature.publicKeys = struct.asset.multiSignature.publicKeys.slice(1);
        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to malformed for publicKeys", () => {
        transaction.multiSignatureAsset(multiSignatureAsset).sign("passphrase");
        signTransaction(transaction, passphrases);

        const struct = transaction.getStruct();
        struct.asset.multiSignature.publicKeys = participants.map((value) => `-${value.slice(1)}`);
        let { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();

        struct.asset.multiSignature.publicKeys = participants.map((value) => "a");
        error = Ajv.validate(transactionSchema.$id, struct).error;
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should validate legacy multisignature", () => {
        const legacyMultiSignature = {
            version: 1,
            network: 23,
            type: 4,
            timestamp: 53253482,
            senderPublicKey: "0333421e69d3531a1c43c43cd4b9344e5a10640644a5fd35618b6306f3a4d7f208",
            fee: "2000000000",
            amount: "0",
            asset: {
                multiSignatureLegacy: {
                    keysgroup: [
                        "+034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                        "+0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
                        "+0392a762e0123945455b7afe675e5ab98fb1586de43e5682514b9454d6edced724",
                    ],
                    lifetime: 24,
                    min: 2,
                },
            },
            signature:
                "304402206009fbf8592e2e3485bc0aa84dbbc8c78326d59191daf870693bc3446b5eeeee02200b4ff5dd53b1e337fe6fbe090f42337dcfc4242c802c340815326e3858d13d6b",
            id: "32aa60577531c190e6a29d28f434367c84c2f0a62eceba5c5483a3983639d51a",
        };

        const { error } = Ajv.validate(schemas.multiSignatureLegacy, legacyMultiSignature);
        expect(error).toBeUndefined();
    });
});

describe("Multi Payment Transaction", () => {
    const address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
    let multiPayment = BuilderFactory.multiPayment();

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.MultiPayment).getSchema();
    });

    beforeEach(() => {
        multiPayment = BuilderFactory.multiPayment().fee("1");
    });

    it("should be valid with 2 payments", () => {
        multiPayment.addPayment(address, "150").addPayment(address, "100").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, multiPayment.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid with 0 or 1 payment", () => {
        multiPayment.sign("passphrase");
        const { error: errorZeroPayment } = Ajv.validate(transactionSchema.$id, multiPayment.data);
        expect(errorZeroPayment).not.toBeUndefined();

        multiPayment.addPayment(address, "100").sign("passphrase");

        const { error: errorOnePayment } = Ajv.validate(transactionSchema.$id, multiPayment.data);
        expect(errorOnePayment).not.toBeUndefined();
    });

    it("should not accept more than `multiPaymentLimit` payments", () => {
        const limit = configManager.getMilestone().multiPaymentLimit;

        for (let i = 0; i < limit; i++) {
            multiPayment.addPayment(address, `${i + 1}`);
        }

        multiPayment.data.asset.payments.push({ amount: Utils.BigNumber.ONE, recipientId: address });
        multiPayment.sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, multiPayment.data);
        expect(error).not.toBeUndefined();

        configManager.getMilestone().multiPaymentLimit = 10;
        multiPayment.data.asset.payments = multiPayment.data.asset.payments.slice(0, 50);
        expect(Ajv.validate(transactionSchema.$id, multiPayment.data).error).not.toBeUndefined();

        multiPayment.data.asset.payments = multiPayment.data.asset.payments.slice(0, 10);
        expect(Ajv.validate(transactionSchema.$id, multiPayment.data).error).toBeUndefined();

        configManager.getMilestone().multiPaymentLimit = 2;
        expect(Ajv.validate(transactionSchema.$id, multiPayment.data).error).not.toBeUndefined();

        multiPayment.data.asset.payments = [
            { amount: Utils.BigNumber.ONE, recipientId: address },
            { amount: Utils.BigNumber.ONE, recipientId: address },
        ];

        expect(Ajv.validate(transactionSchema.$id, multiPayment.data).error).toBeUndefined();
        configManager.getMilestone().multiPaymentLimit = limit;
        expect(Ajv.validate(transactionSchema.$id, multiPayment.data).error).toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        multiPayment.addPayment(address, "150").addPayment(address, "100").fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, multiPayment.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});

describe("HTLC Lock Transaction", () => {
    const address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
    const fee = 1 * ARKTOSHI;
    const amount = 10 * ARKTOSHI;
    const htlcLockAsset = {
        secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
        expiration: {
            type: HtlcLockExpirationType.EpochTimestamp,
            value: Math.floor(Date.now() / 1000),
        },
    };

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.HtlcLock).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.htlcLock().htlcLockAsset(htlcLockAsset);
    });

    it("should be valid with valid secret hash and expiration timestamp", () => {
        transaction.recipientId(address).fee(fee).amount(amount).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid with incorrect secret hash length", () => {
        transaction
            .htlcLockAsset({
                secretHash: "asdf123asdf123asdf123asdf123asd",
                expiration: {
                    type: HtlcLockExpirationType.EpochTimestamp,
                    value: Math.floor(Date.now() / 1000),
                },
            })
            .recipientId(address)
            .fee(fee)
            .amount(amount)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid when expiration value is not a number", () => {
        transaction.recipientId(address).fee(fee).amount(amount).sign("passphrase");

        const struct = transaction.getStruct();
        struct.asset.lock.expiration.value = "woop";

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to no address", () => {
        transaction.recipientId(undefined).amount(amount).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to invalid address", () => {
        transaction.recipientId(address).amount(amount).sign("passphrase");

        const struct = transaction.getStruct();
        struct.recipientId = "woop";

        const { error } = Ajv.validate(transactionSchema.$id, struct);
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero amount", () => {
        transaction.recipientId(address).amount(0).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to zero fee", () => {
        transaction.recipientId(address).amount("1").fee("0").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});

describe("HTLC Claim Transaction", () => {
    const address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
    const fee = "0";
    const htlcClaimAsset = {
        lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        unlockSecret: htlcSecretHex,
    };

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.HtlcClaim).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.htlcClaim().htlcClaimAsset(htlcClaimAsset);
    });

    it("should be valid with valid transaction id and unlock secret", () => {
        transaction.recipientId(address).fee(fee).sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid with incorrect transaction id length", () => {
        transaction
            .htlcClaimAsset({
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb",
                unlockSecret: htlcSecretHex,
            })
            .recipientId(address)
            .fee(fee)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid with non-hex transaction id", () => {
        transaction
            .htlcClaimAsset({
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2ebw",
                unlockSecret: htlcSecretHex,
            })
            .recipientId(address)
            .fee(fee)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid with incorrect unlock secret length", () => {
        transaction
            .htlcClaimAsset({
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb",
                unlockSecret: "c27f1ce845d8c291b1a8b0be4204c65377151a",
            })
            .recipientId(address)
            .fee(fee)
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction.recipientId(address).amount("1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero fee", () => {
        transaction.recipientId(address).amount("0").fee("1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});

describe("HTLC Refund Transaction", () => {
    const address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
    const htlcRefundAsset = {
        lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
    };

    beforeAll(() => {
        transactionSchema = TransactionTypeFactory.get(TransactionType.HtlcRefund).getSchema();
    });

    beforeEach(() => {
        transaction = BuilderFactory.htlcRefund().recipientId(address).fee("0").htlcRefundAsset(htlcRefundAsset);
    });

    it("should be valid with valid transaction id", () => {
        transaction.sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).toBeUndefined();
    });

    it("should be invalid with incorrect transaction id length", () => {
        transaction
            .htlcRefundAsset({
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb",
            })
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid with non-hex transaction id", () => {
        transaction
            .htlcRefundAsset({
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2ebw",
            })
            .sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero amount", () => {
        transaction.recipientId(address).amount("1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to non-zero fee", () => {
        transaction.recipientId(address).amount("0").fee("1").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });

    it("should be invalid due to wrong transaction type", () => {
        transaction = BuilderFactory.delegateRegistration();
        transaction.usernameAsset("delegate_name").sign("passphrase");

        const { error } = Ajv.validate(transactionSchema.$id, transaction.getStruct());
        expect(error).not.toBeUndefined();
    });
});
