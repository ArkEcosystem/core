import "jest-extended";

import "./mocks/core-container";

import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import {
    Constants,
    Crypto,
    Identities,
    Interfaces,
    Managers,
    Networks,
    Transactions,
    Utils,
} from "@arkecosystem/crypto";
import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates } from "../../utils/fixtures/testnet/delegates";

let connection: Connection;
let memory: Memory;
let poolWalletManager: WalletManager;
let databaseWalletManager: Wallets.WalletManager;

beforeAll(async () => {
    Managers.configManager.setFromPreset("testnet");

    memory = new Memory();
    poolWalletManager = new WalletManager();
    connection = new Connection({
        options: defaults,
        walletManager: poolWalletManager,
        memory,
        storage: new Storage(),
    });

    await connection.make();

    //  jest.spyOn(Transactions.Verifier, "verify").mockReturnValue(true);
});

const mockCurrentHeight = (height: number) => {
    // @ts-ignore
    jest.spyOn(memory, "currentHeight").mockReturnValue(height);
    Managers.configManager.setHeight(height);
};

describe("Connection", () => {
    beforeEach(() => {
        mockCurrentHeight(1);

        connection.flush();
        poolWalletManager.reset();

        databaseWalletManager = new Wallets.WalletManager();

        for (let i = 0; i < delegates.length; i++) {
            const { publicKey } = delegates[i];
            const wallet = databaseWalletManager.findByPublicKey(publicKey);
            wallet.balance = Utils.BigNumber.make(100_000 * Constants.ARKTOSHI);
            wallet.username = `delegate-${i + 1}`;
            wallet.vote = publicKey;

            databaseWalletManager.reindex(wallet);
        }

        databaseWalletManager.buildDelegateRanking();
        databaseWalletManager.buildVoteBalances();

        // @ts-ignore
        connection.databaseService.walletManager = databaseWalletManager;

        jest.restoreAllMocks();
    });

    const addTransactionsToMemory = transactions => {
        for (const tx of transactions) {
            memory.remember(tx);
            expect(memory.has(tx.id)).toBeTrue();
        }
        expect(memory.count()).toBe(transactions.length);
    };

    const expectForgingTransactions = async (transactions: Interfaces.ITransaction[], countGood: number) => {
        addTransactionsToMemory(transactions);

        const forgingTransactions = await connection.getTransactionsForForging(100);
        expect(forgingTransactions).toHaveLength(countGood);
        expect(forgingTransactions).toEqual(
            transactions.slice(transactions.length - countGood).map(({ serialized }) => serialized.toString("hex")),
        );
    };

    const customSerialize = (transaction: Interfaces.ITransactionData, options: any = {}) => {
        const buffer = new ByteBuffer(512, true);
        const writeByte = (txField, value) => (options[txField] ? options[txField](buffer) : buffer.writeByte(value));
        const writeUint32 = (txField, value) =>
            options[txField] ? options[txField](buffer) : buffer.writeUint32(value);
        const writeUint64 = (txField, value) =>
            options[txField] ? options[txField](buffer) : buffer.writeUint64(value);
        const append = (txField, value, encoding = "utf8") =>
            options[txField] ? options[txField](buffer) : buffer.append(value, encoding);

        buffer.writeByte(0xff); // fill, to disambiguate from v1
        writeByte("version", 0x01);
        writeByte("network", transaction.network); // ark = 0x17, devnet = 0x30
        writeByte("type", transaction.type);
        writeUint32("timestamp", transaction.timestamp);
        append("senderPublicKey", transaction.senderPublicKey, "hex");
        writeUint64("fee", +transaction.fee);

        if (options.vendorField) {
            options.vendorField(buffer);
        } else if (transaction.vendorField) {
            const vf: Buffer = Buffer.from(transaction.vendorField, "utf8");
            buffer.writeByte(vf.length);
            buffer.append(vf);
        } else if (transaction.vendorFieldHex) {
            buffer.writeByte(transaction.vendorFieldHex.length / 2);
            buffer.append(transaction.vendorFieldHex, "hex");
        } else {
            buffer.writeByte(0x00);
        }

        // only for transfer right now
        writeUint64("amount", +transaction.amount);
        writeUint32("expiration", transaction.expiration || 0);
        append("recipientId", bs58check.decode(transaction.recipientId));

        // signatures
        if (transaction.signature || options.signature) {
            append("signature", transaction.signature, "hex");
        }

        const secondSignature: string = transaction.secondSignature || transaction.signSignature;

        if (secondSignature || options.secondSignature) {
            append("secondSignature", secondSignature, "hex");
        }

        if (options.signatures) {
            options.signatures(buffer);
        } else if (transaction.signatures) {
            if (transaction.version === 1 && Utils.isException(transaction)) {
                buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
                buffer.append(transaction.signatures.join(""), "hex");
            } else {
                buffer.append(transaction.signatures.join(""), "hex");
            }
        }

        return buffer.flip().toBuffer();
    };

    describe("getTransactionsForForging", () => {
        it("should remove transactions that have expired [5 Good, 5 Bad]", async () => {
            mockCurrentHeight(100);

            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload([{ expiration: 1 }], { quantity: 5 })
                .build(10);

            await expectForgingTransactions(transactions, 5);
        });

        it("should remove transactions that have a fee of 0 or less [8 Good, 2 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload(
                    [
                        { amount: Utils.BigNumber.make(1000), fee: Utils.BigNumber.ZERO },
                        { amount: Utils.BigNumber.make(1000), fee: Utils.BigNumber.make(-100) },
                    ],
                    { quantity: 2 },
                )
                .build(10);

            await expectForgingTransactions(transactions, 8);
        });

        it("should remove transactions that have an amount of 0 or less [8 Good, 2 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload(
                    [
                        { amount: Utils.BigNumber.ZERO, fee: Utils.BigNumber.ONE },
                        { amount: Utils.BigNumber.make(-1), fee: Utils.BigNumber.ONE },
                    ],
                    { quantity: 2 },
                )
                .build(10);

            await expectForgingTransactions(transactions, 8);
        });

        it("should remove transactions that have data from another network [5 Good, 5 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload(
                    [{ recipientId: Identities.Address.fromPassphrase("secret", Networks.devnet.network.pubKeyHash) }],
                    { quantity: 5 },
                )
                .build(10);

            await expectForgingTransactions(transactions, 5);
        });

        it("should remove transactions that have wrong sender public keys [5 Good, 5 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload([{ senderPublicKey: Identities.PublicKey.fromPassphrase("this is wrong") }], {
                    quantity: 5,
                })
                .build(10);

            await expectForgingTransactions(transactions, 5);
        });

        it("should remove transactions that have timestamps in the future [5 Good, 5 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload([{ timestamp: Crypto.Slots.getTime() + 100 * 1000 }], { quantity: 5 })
                .build(10);

            await expectForgingTransactions(transactions, 5);
        });

        it("should remove transactions that have different IDs when entering and leaving [8 Good, 2 Bad]", async () => {
            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload([{ id: "garbage" }, { id: "garbage 2" }], { quantity: 2 })
                .build(10);

            await expectForgingTransactions(transactions, 8);
        });

        it("should remove transactions that have malformed bytes", async () => {
            const malformedBytesFn = [
                { version: (b: ByteBuffer) => b.writeUint64(1111111) },
                { network: (b: ByteBuffer) => b.writeUint64(1111111) },
                { type: (b: ByteBuffer) => b.writeUint64(1111111) },
                { timestamp: (b: ByteBuffer) => b.writeByte(0x01) },
                { senderPublicKey: (b: ByteBuffer) => b.writeByte(0x01) },
                { vendorField: (b: ByteBuffer) => b.writeByte(0x01) },
                { amount: (b: ByteBuffer) => b.writeByte(0x01) },
                { expiration: (b: ByteBuffer) => b.writeByte(0x01) },
                { recipientId: (b: ByteBuffer) => b.writeByte(0x01) },
                { signature: (b: ByteBuffer) => b.writeByte(0x01) },
                { secondSignature: (b: ByteBuffer) => b.writeByte(0x01) },
                { signatures: (b: ByteBuffer) => b.writeByte(0x01) },
            ];
            const transactions = TransactionFactory.transfer().build(malformedBytesFn.length + 5);
            transactions.map((tx, i) => (tx.serialized = customSerialize(tx.data, malformedBytesFn[i] || {})));

            await expectForgingTransactions(transactions, 5);
        });

        it("should call `TransactionFactory.fromBytes`", async () => {
            const transactions = TransactionFactory.transfer().build(5);
            const spy = jest.spyOn(Transactions.TransactionFactory, "fromBytes");
            await expectForgingTransactions(transactions, 5);
            expect(spy).toHaveBeenCalled();
        });

        it("should call `TransactionHandler.canBeApplied`", async () => {
            const transactions = TransactionFactory.transfer().build(5);
            const spy = jest.spyOn(Handlers.Registry.get(0), "canBeApplied");
            await expectForgingTransactions(transactions, 5);
            expect(spy).toHaveBeenCalled();
        });

        it.todo("should remove transactions that have an unknown type");
        it.todo("should remove transactions that have unknown properties");
        it.todo("should remove transactions that have missing properties");
        it.todo("should remove transactions that have malformed properties");
        it.todo("should remove transactions that have additional bytes attached");
        it.todo("should remove transactions that have a disabled type");
        it.todo("should remove transactions that have have data of a another transaction type");
        it.todo("should remove transactions that have been altered after entering the pool");
        it.todo("should remove transactions that have negative numerical values");
        it.todo("should remove transactions that have malformed signatures");
        it.todo("should remove transactions that have malformed second signatures");
        it.todo("should remove transactions that have malformed multi signatures");
        it.todo("should remove transactions that fail to deserialize for unknown reasons");
        it.todo("should remove transactions that have a mismatch of expected and actual length of the vendor field");
        it.todo("should remove transactions that have an invalid vendor field length");
        it.todo("should remove transactions that have an invalid vendor field");
        it.todo("should remove transactions that have an invalid version");

        it.todo("should remove transactions that have already been forged");
        it.todo("should remove transactions that have been persisted to the disk");
    });
});
