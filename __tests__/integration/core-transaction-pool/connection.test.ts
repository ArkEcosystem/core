import "jest-extended";

import { Container, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Identities, Networks, Transactions, Utils } from "@arkecosystem/crypto";

import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { ConnectionManager } from "../../../packages/core-transaction-pool/src/manager";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { setUpFull, tearDownFull } from "./__support__/setup";

const bignum = Utils.BigNumber.make;

let container: Container.IContainer;
let connection: TransactionPool.IConnection;
let memory: Memory;

beforeAll(async () => {
    container = await setUpFull();

    memory = new Memory();
    connection = container.resolvePlugin("transaction-pool");
    connection = await new ConnectionManager().createConnection(
        new Connection({
            options: defaults,
            walletManager: new WalletManager(),
            memory,
            storage: new Storage(),
        }),
    );
});

afterAll(async () => {
    await tearDownFull();
});

beforeEach(() => {
    connection.flush();
});

describe("Connection", () => {
    describe("getTransactionsForForging", () => {
        const createTransaction = (transactionData, passphrase) => {
            const sign = (transactionData, passphrase) => {
                const keys = Identities.Keys.fromPassphrase(passphrase);

                transactionData.senderPublicKey = transactionData.senderPublicKey || keys.publicKey;
                transactionData.id = Transactions.Utils.getId(transactionData);

                transactionData.signature = Transactions.Signer.sign(transactionData, keys);

                return transactionData;
            };

            const transaction = Transactions.TransactionTypeFactory.create(sign(transactionData, passphrase));

            Transactions.Serializer.serialize(transaction);

            return Transactions.TransactionFactory.fromBytesUnsafe(transaction.serialized);
        };

        const createTransfer = options => {
            const builder = Transactions.BuilderFactory.transfer()
                .recipientId(Identities.Address.fromPassphrase("this is fine", Networks.unitnet.network.pubKeyHash))
                .amount("111")
                .fee("11")
                .expiration(11);
            for (const [option, value] of Object.entries(options)) {
                builder.data[option] = value;
            }

            return createTransaction(builder.data, options.passphrase || "the sender passphrase");
        };

        const addTransactionsToMemory = transactions => {
            for (const tx of transactions) {
                memory.remember(tx);
                expect(memory.has(tx.id)).toBeTrue();
            }
            expect(memory.count()).toBe(transactions.length);
        };

        it("should remove transactions that have expired", () => {
            const transactions = [createTransfer({}), createTransfer({ amount: bignum(123), expiration: 1 })];

            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it("should remove transactions that have a fee of 0 or less", () => {
            const transactions = [
                createTransfer({}),
                createTransfer({ amount: bignum(1234), fee: bignum(-2) }),
                createTransfer({ amount: bignum(2345), fee: bignum(0) }),
            ];

            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it("should remove transactions that have an amount of 0 or less", () => {
            const transactions = [
                createTransfer({}),
                createTransfer({ amount: bignum(-2) }),
                createTransfer({ amount: bignum(0) }),
            ];

            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it("should remove transactions that have data from another network", () => {
            const transactions = [
                createTransfer({}),
                createTransfer({
                    recipientId: Identities.Address.fromPassphrase("this is fine", Networks.devnet.network.pubKeyHash),
                }),
            ];

            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it.skip("should remove transactions that have wrong sender public keys", () => {
            const transactions = [
                createTransfer({}),
                createTransfer({ senderPublicKey: Identities.PublicKey.fromPassphrase("this is wrong") }),
            ];

            expect(transactions[1]).toEqual({});
            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it.skip("should remove transactions that have timestamps in the future", () => {
            const transactions = [
                createTransfer({}),
                createTransfer({ amount: bignum(1234), timestamp: Crypto.Slots.getTime() + 100 * 1000 }),
            ];

            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it.skip("should remove transactions that have different IDs when entering and leaving", () => {
            const transactions = [createTransfer({}), createTransfer({ amount: bignum(1234), id: "64738638929" })];

            expect(transactions[1]).toEqual({});
            addTransactionsToMemory(transactions);

            expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        });

        it.todo("should remove transactions that have an unknown type");
        it.todo("should remove transactions that have unknown properties");
        it.todo("should remove transactions that have missing properties");
        it.todo("should remove transactions that have malformed properties");
        it.todo("should remove transactions that have malformed bytes");
        it.todo("should remove transactions that have additional bytes attached");
        it.todo("should remove transactions that have already been forged");
        it.todo("should remove transactions that have been persisted to the disk");
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
    });
});
