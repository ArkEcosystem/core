import { Container } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";
import { ensureFileSync } from "fs-extra";

import { Storage } from "../../../packages/core-transaction-pool/src/storage";

jest.mock("fs-extra");

const configuration = { getRequired: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);

beforeEach(() => {
    configuration.getRequired.mockReset();
});

Managers.configManager.getMilestone().aip11 = true;
const transaction1 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("900")
    .sign("sender's secret")
    .build();
const transaction2 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("900")
    .sign("sender's secret")
    .build();

describe("Storage.boot", () => {
    it("should instantiate BetterSqlite3 using configured filename", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            const database = storage["database"];
            expect(ensureFileSync).toBeCalledWith(":memory:");
            expect(database.name).toBe(":memory:");
            expect(database.open).toBe(true);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.dispose", () => {
    it("should close database", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();
        const database = storage["database"];

        storage.dispose();

        expect(database.open).toBe(false);
    });
});

describe("Storage.hasTransaction", () => {
    it("should find transaction that was added", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            const has = storage.hasTransaction(transaction1.id);
            expect(has).toBe(true);
        } finally {
            storage.dispose();
        }
    });

    it("should not find transaction that wasn't added", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            const has = storage.hasTransaction(transaction2.id);
            expect(has).toBe(false);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.getAllTransactions", () => {
    it("should return all added transactions", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            const storedTransaction1 = {
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            };

            const storedTransaction2 = {
                height: 100,
                id: transaction2.id,
                senderPublicKey: transaction2.data.senderPublicKey,
                serialized: transaction2.serialized,
            };

            storage.addTransaction(storedTransaction1);
            storage.addTransaction(storedTransaction2);

            const allTransactions = Array.from(storage.getAllTransactions());
            expect(allTransactions).toEqual([storedTransaction1, storedTransaction2]);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.getOldTransactions", () => {
    it("should return only old transactions", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            const storedTransaction1 = {
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            };

            const storedTransaction2 = {
                height: 200,
                id: transaction2.id,
                senderPublicKey: transaction2.data.senderPublicKey,
                serialized: transaction2.serialized,
            };

            storage.addTransaction(storedTransaction1);
            storage.addTransaction(storedTransaction2);

            const oldTransactions = Array.from(storage.getOldTransactions(100));
            expect(oldTransactions).toEqual([storedTransaction1]);
        } finally {
            storage.dispose();
        }
    });

    it("should return all old transactions", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            const storedTransaction1 = {
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            };

            const storedTransaction2 = {
                height: 200,
                id: transaction2.id,
                senderPublicKey: transaction2.data.senderPublicKey,
                serialized: transaction2.serialized,
            };

            storage.addTransaction(storedTransaction1);
            storage.addTransaction(storedTransaction2);

            const oldTransactions = Array.from(storage.getOldTransactions(200));
            expect(oldTransactions).toEqual([storedTransaction2, storedTransaction1]);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.addTransaction", () => {
    it("should add new transaction", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            const has = storage.hasTransaction(transaction1.id);
            expect(has).toBe(true);
        } finally {
            storage.dispose();
        }
    });

    it("should throw when adding same transaction twice", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            expect(() => {
                storage.addTransaction({
                    height: 100,
                    id: transaction1.id,
                    senderPublicKey: transaction1.data.senderPublicKey,
                    serialized: transaction1.serialized,
                });
            }).toThrow();
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.removeTransaction", () => {
    it("should remove previously added transaction", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            storage.removeTransaction(transaction1.id);

            const has = storage.hasTransaction(transaction1.id);
            expect(has).toBe(false);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.flush", () => {
    it("should remove all previously added transactions", () => {
        configuration.getRequired.mockReturnValueOnce(":memory:"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction({
                height: 100,
                id: transaction1.id,
                senderPublicKey: transaction1.data.senderPublicKey,
                serialized: transaction1.serialized,
            });

            storage.addTransaction({
                height: 100,
                id: transaction2.id,
                senderPublicKey: transaction2.data.senderPublicKey,
                serialized: transaction2.serialized,
            });

            storage.flush();

            const allTransactions = Array.from(storage.getAllTransactions());
            expect(allTransactions).toStrictEqual([]);
        } finally {
            storage.dispose();
        }
    });
});
