import "jest-extended";

import { container } from "./mocks/core-container";

import ByteBuffer from "bytebuffer";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Constants, Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
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

    const maxTransactionAge = 2700;
    memory = new Memory(maxTransactionAge);

    container.app.resolvePlugin("database").walletManager = new Wallets.WalletManager();

    poolWalletManager = new WalletManager();
    connection = new Connection({
        options: defaults,
        walletManager: poolWalletManager,
        memory,
        storage: new Storage(),
    });

    await connection.make();
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
            wallet.setAttribute("delegate", {
                username: `delegate-${i + 1}`,
                voteBalance: Utils.BigNumber.ZERO,
            });
            wallet.setAttribute("vote", publicKey);

            if (i === 50) {
                wallet.setAttribute("secondPublicKey", Identities.PublicKey.fromPassphrase("second secret"));
            }

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

    const expectForgingTransactions = async (
        transactions: Interfaces.ITransaction[],
        countGood: number,
        sliceBeginning?: boolean,
    ): Promise<string[]> => {
        addTransactionsToMemory(transactions);

        const forgingTransactions = await connection.getTransactionsForForging(100);
        expect(forgingTransactions).toHaveLength(countGood);
        expect(forgingTransactions).toEqual(
            transactions
                .slice(sliceBeginning ? 0 : transactions.length - countGood, sliceBeginning ? countGood : undefined)
                .map(({ serialized }) => serialized.toString("hex")),
        );

        return forgingTransactions;
    };

    const customSerialize = (transaction: Interfaces.ITransactionData, options: any = {}) => {
        const buffer = new ByteBuffer(512, true);
        const writeByte = (txField, value) => (options[txField] ? options[txField](buffer) : buffer.writeByte(value));
        const writeUint16 = (txField, value) =>
            options[txField] ? options[txField](buffer) : buffer.writeUint16(value);
        const writeUint32 = (txField, value) =>
            options[txField] ? options[txField](buffer) : buffer.writeUint32(value);
        const writeUint64 = (txField, value) =>
            // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
            options[txField] ? options[txField](buffer) : buffer.writeUint64(value.toFixed());
        const append = (txField, value, encoding = "utf8") =>
            options[txField] ? options[txField](buffer) : buffer.append(value, encoding);

        buffer.writeByte(0xff); // fill, to disambiguate from v1
        writeByte("version", 0x02);
        writeByte("network", transaction.network); // ark = 0x17, devnet = 0x30
        writeUint32("typeGroup", transaction.typeGroup || Enums.TransactionTypeGroup.Core);
        writeUint16("type", transaction.type);

        if (transaction.nonce) {
            writeUint64("nonce", transaction.nonce);
        } else {
            writeUint32("timestamp", transaction.timestamp);
        }

        append("senderPublicKey", transaction.senderPublicKey, "hex");
        writeUint64("fee", transaction.fee);

        if (options.vendorField) {
            options.vendorField(buffer);
        } else if (transaction.vendorField) {
            const vf: Buffer = Buffer.from(transaction.vendorField, "utf8");
            buffer.writeByte(vf.length);
            buffer.append(vf);
        } else {
            buffer.writeByte(0x00);
        }

        // only for transfer right now
        writeUint64("amount", transaction.amount);
        writeUint32("expiration", transaction.expiration || 0);
        append("recipientId", Utils.Base58.decodeCheck(transaction.recipientId));

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
        it("should call `TransactionFactory.fromBytes`", async () => {
            const transactions = TransactionFactory.transfer()
                .withVersion(2)
                .build(5);
            const spy = jest.spyOn(Transactions.TransactionFactory, "fromBytes");
            await expectForgingTransactions(transactions, 5);
            expect(spy).toHaveBeenCalled();
        });

        it("should call `TransactionHandler.throwIfCannotBeApplied`", async () => {
            const transactions = TransactionFactory.transfer().build(5);
            const handler = await Handlers.Registry.get(0);
            const spy = jest.spyOn(handler, "throwIfCannotBeApplied");
            await expectForgingTransactions(transactions, 5);
            expect(spy).toHaveBeenCalled();
        });

        it("should call `removeForgedTransactions`", async () => {
            const transactions = TransactionFactory.transfer().build(5);
            const spy = jest.spyOn(connection as any, "removeForgedTransactions");
            await expectForgingTransactions(transactions, 5);
            expect(spy).toHaveBeenCalled();
        });

        it("should remove multiple transactions of same sender that cannot be applied due to previous transaction", async () => {
            const transactions = TransactionFactory.transfer()
                .withPassphrase(delegates[20].passphrase)
                .build(5);

            const sender = databaseWalletManager.findByPublicKey(delegates[20].publicKey);
            sender.balance = transactions[0].data.amount.plus(transactions[0].data.fee).times(3);

            await expectForgingTransactions(transactions, 3, true);
        });

        it("should remove transactions that cannot be applied due to previous transaction", async () => {
            const transactionA = TransactionFactory.transfer(delegates[21].address, 101 * 1e8)
                .withPassphrase(delegates[20].passphrase)
                .build(1)[0];

            const transactionBs = TransactionFactory.transfer(delegates[20].address, 100 * 1e8)
                .withPassphrase(delegates[21].passphrase)
                .build(5);

            const walletA = databaseWalletManager.findByPublicKey(delegates[20].publicKey);
            walletA.balance = transactionA.data.amount.plus(transactionA.data.fee);

            const walletB = databaseWalletManager.findByPublicKey(delegates[21].publicKey);
            walletB.balance = Utils.BigNumber.ZERO;

            await expectForgingTransactions([transactionBs[0], transactionA], 1);

            memory.flush();

            await expectForgingTransactions([transactionA, ...transactionBs], 2, true);
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

            const transactions = TransactionFactory.transfer().build(5);
            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(malformedBytesFn.length);

            malformedTransactions.map((tx, i) => (tx.serialized = customSerialize(tx.data, malformedBytesFn[i] || {})));

            await expectForgingTransactions([...malformedTransactions, ...transactions], 5);
        });

        it("should remove transactions that have data from another network", async () => {
            const transactions = TransactionFactory.transfer().build(4);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                network: (b: ByteBuffer) => b.writeUint8(3),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 4);
        });

        it("should remove transactions that have wrong sender public keys", async () => {
            const transactions = TransactionFactory.transfer().build(4);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                senderPublicKey: (b: ByteBuffer) =>
                    b.append(Buffer.from(Identities.PublicKey.fromPassphrase("garbage"), "hex")),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 4);
        });

        it("should remove transactions that have timestamps in the future", async () => {
            const transactions = TransactionFactory.transfer().build(4);

            const malformedTransactions = TransactionFactory.transfer()
                .withVersion(1)
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                timestamp: (b: ByteBuffer) => b.writeUint32(Crypto.Slots.getTime() + 100 * 1000),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 4);
        });

        it("should remove transactions that have different IDs when entering and leaving", async () => {
            const transactions = TransactionFactory.transfer().build(4);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].data.id = "garbage";

            await expectForgingTransactions([...malformedTransactions, ...transactions], 4);
        });

        it("should remove transactions that have an unknown type", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                version: (b: ByteBuffer) => b.writeUint8(255),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have a disabled type", async () => {
            const transactions = TransactionFactory.transfer().build(2);

            transactions[1].serialized = customSerialize(transactions[1].data, {
                version: (b: ByteBuffer) => b.writeUint8(4),
            });

            await expectForgingTransactions(transactions, 1, true);
        });

        it("should remove transactions that have have data of a another transaction type", async () => {
            const handlers: Handlers.TransactionHandler[] = Handlers.Registry.getAll();
            const transactions: Interfaces.ITransaction[] = TransactionFactory.transfer().build(handlers.length);

            for (let i = 0; i < handlers.length; i++) {
                expect(handlers[0].getConstructor().type).toEqual(0);
                transactions[i].serialized = customSerialize(transactions[i].data, {
                    type: (b: ByteBuffer) => b.writeUint16(handlers[i].getConstructor().type),
                });
            }

            await expectForgingTransactions(transactions.reverse(), 1);
        });

        it("should remove transactions that have negative numerical values", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                fee: (b: ByteBuffer) => b.writeUint64(-999999),
                amount: (b: ByteBuffer) => b.writeUint64(-999999),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have expired", async () => {
            mockCurrentHeight(100);

            const transactions = TransactionFactory.transfer().build(4);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                expiration: (b: ByteBuffer) => b.writeByte(0x01),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 4);
        });

        it("should remove transactions that have an amount or fee of 0", async () => {
            const transactions = TransactionFactory.transfer().build(3);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(2);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                fee: (b: ByteBuffer) => b.writeByte(0x00),
            });

            malformedTransactions[1].serialized = customSerialize(malformedTransactions[0].data, {
                amount: (b: ByteBuffer) => b.writeByte(0),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 3);
        });

        it("should remove transactions that have been altered after entering the pool", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].data.id = malformedTransactions[0].data.id
                .split("")
                .reverse()
                .join("");

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have an invalid version", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(1);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                version: (b: ByteBuffer) => b.writeByte(0),
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have a mismatch of expected and actual length of the vendor field", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(2);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                vendorField: (b: ByteBuffer) => {
                    const vendorField = Buffer.from(malformedTransactions[0].data.vendorField, "utf8");
                    b.writeByte(vendorField.length - 5);
                    b.append(vendorField);
                },
            });

            malformedTransactions[1].serialized = customSerialize(malformedTransactions[1].data, {
                vendorField: (b: ByteBuffer) => {
                    const vendorField = Buffer.from(malformedTransactions[1].data.vendorField, "utf8");
                    b.writeByte(vendorField.length + 5);
                    b.append(vendorField);
                },
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have an invalid vendor field length", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(2);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                vendorField: (b: ByteBuffer) => {
                    const vendorField = Buffer.from(malformedTransactions[0].data.vendorField, "utf8");
                    b.writeByte(0);
                    b.append(vendorField);
                },
            });

            malformedTransactions[1].serialized = customSerialize(malformedTransactions[1].data, {
                vendorField: (b: ByteBuffer) => {
                    b.writeByte(255);
                },
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have an invalid vendor field", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(2);

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                vendorField: (b: ByteBuffer) => {
                    const vendorField = Buffer.from(malformedTransactions[0].data.vendorField.toUpperCase(), "utf8");
                    b.writeByte(vendorField.length);
                    b.append(vendorField);
                },
            });

            malformedTransactions[1].serialized = customSerialize(malformedTransactions[1].data, {
                vendorField: (b: ByteBuffer) => {
                    b.writeByte(255);
                    b.fill(0, b.offset);
                },
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have additional bytes attached", async () => {
            const transactions = TransactionFactory.transfer().build(1);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(4);

            const appendBytes = (transaction: Interfaces.ITransaction, garbage: Buffer) => {
                const buffer = new ByteBuffer(512, true);
                buffer.append(transaction.serialized);
                buffer.append(garbage);

                transaction.serialized = buffer.flip().toBuffer();
            };

            appendBytes(malformedTransactions[0], Buffer.from("garbage", "utf8"));
            appendBytes(malformedTransactions[1], Buffer.from("ff", "hex"));
            appendBytes(malformedTransactions[2], Buffer.from("00011111", "hex"));
            appendBytes(malformedTransactions[3], Buffer.from("0001", "hex"));

            await expectForgingTransactions([...malformedTransactions, ...transactions], 1);
        });

        it("should remove transactions that have malformed signatures", async () => {
            const transactions = TransactionFactory.transfer().build(2);

            const malformedTransactions = TransactionFactory.transfer()
                .withPassphrase(delegates[2].passphrase)
                .build(3);

            const makeSignature = (from: string): string => {
                return Crypto.Hash.signECDSA(
                    Buffer.from(Crypto.HashAlgorithms.sha256(from)),
                    Identities.Keys.fromPassphrase("garbage"),
                );
            };

            malformedTransactions[0].serialized = customSerialize(malformedTransactions[0].data, {
                signatures: (b: ByteBuffer) => {
                    b.append(Buffer.from(makeSignature("garbage").slice(25), "hex"));
                },
            });

            malformedTransactions[1].serialized = customSerialize(malformedTransactions[0].data, {
                signatures: (b: ByteBuffer) => {
                    b.append(Buffer.from(makeSignature("garbage").repeat(2), "hex"));
                },
            });

            malformedTransactions[2].serialized = customSerialize(malformedTransactions[0].data, {
                signatures: (b: ByteBuffer) => {
                    b.append(Buffer.from(makeSignature("garbage") + "affe", "hex"));
                },
            });

            await expectForgingTransactions([...malformedTransactions, ...transactions], 2);
        });

        it("should remove transactions that have malformed second signatures", async () => {
            const transactions = TransactionFactory.transfer()
                .withPassphrasePair({
                    passphrase: delegates[50].passphrase,
                    secondPassphrase: "second secret",
                })
                .build(5);

            const appendBytes = (transaction: Interfaces.ITransaction, garbage: Buffer) => {
                const buffer = new ByteBuffer(512, true);
                buffer.append(transaction.serialized);
                buffer.append(garbage);

                transaction.serialized = buffer.flip().toBuffer();
            };

            appendBytes(transactions[2], Buffer.from("ff", "hex"));
            appendBytes(transactions[3], Buffer.from("00", "hex"));
            appendBytes(transactions[4], Buffer.from("0011001100", "hex"));

            await expectForgingTransactions(transactions, 2, true);
        });

        it("should remove transactions that have malformed multi signatures", async () => {
            const transactions = TransactionFactory.transfer().build(5);

            const appendBytes = (transaction: Interfaces.ITransaction, garbage: Buffer) => {
                const buffer = new ByteBuffer(512, true);
                buffer.append(transaction.serialized);
                buffer.append(garbage);

                transaction.serialized = buffer.flip().toBuffer();
            };

            const makeSignature = (from: string): string => {
                return Crypto.Hash.signECDSA(
                    Buffer.from(Crypto.HashAlgorithms.sha256(from)),
                    Identities.Keys.fromPassphrase("garbage"),
                );
            };

            appendBytes(transactions[4], Buffer.from("ff" + makeSignature("garbage").repeat(5), "hex"));

            await expectForgingTransactions(transactions, 4, true);
        });

        it("should remove transactions that have malformed multi signatures", async () => {
            const transactions = TransactionFactory.transfer().build(5);

            const appendBytes = (transaction: Interfaces.ITransaction, garbage: Buffer) => {
                const buffer = new ByteBuffer(512, true);
                buffer.append(transaction.serialized);
                buffer.append(garbage);

                transaction.serialized = buffer.flip().toBuffer();
            };

            const makeSignature = (from: string): string => {
                return Crypto.Hash.signECDSA(
                    Buffer.from(Crypto.HashAlgorithms.sha256(from)),
                    Identities.Keys.fromPassphrase("garbage"),
                );
            };
            appendBytes(transactions[4], Buffer.from("ff" + makeSignature("garbage").repeat(5), "hex"));

            await expectForgingTransactions(transactions, 4, true);
        });

        it("should remove all invalid transactions from the transaction pool", async () => {
            const transactions = TransactionFactory.transfer().build(151);
            for (let i = 1; i < transactions.length - 1; i++) {
                transactions[i].serialized = customSerialize(transactions[i].data, {
                    signature: (b: ByteBuffer) => {
                        b.writeByte(0x01);
                    },
                });
            }
            await expectForgingTransactions(transactions, 1, true);
        });

        it("should get all transactions for a new sender (with wallet only indexed by address)", async () => {
            const newSenderPassphrase = "this is a brand new passphrase";
            const newSenderAddress = Identities.Address.fromPassphrase(newSenderPassphrase);
            const transactions = TransactionFactory.transfer()
                .withPassphrase(newSenderPassphrase)
                .build(5);

            // findByAddress is important here so that sender wallet is not indexed by public key
            // which did cause an issue when getting transactions for forging
            const sender = databaseWalletManager.findByAddress(newSenderAddress);
            sender.balance = transactions[0].data.amount.plus(transactions[0].data.fee).times(5);

            await expectForgingTransactions(transactions, 5);
        });
    });
});
