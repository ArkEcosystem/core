import { Container } from "@arkecosystem/core-kernel";
import { Transactions, Managers, Identities } from "@arkecosystem/crypto";
import { ensureFileSync } from "fs-extra";
import BetterSqlite3 from "better-sqlite3";

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
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            const database = storage["database"] as BetterSqlite3.Database;
            expect(ensureFileSync).toBeCalledWith("database.db");
            expect(database.name).toBe("database.db");
            expect(database.open).toBe(true);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.dispose", () => {
    it("should close database", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();
        const database = storage["database"] as BetterSqlite3.Database;

        storage.dispose();

        expect(database.open).toBe(false);
    });
});

describe("Storage.hasTransaction", () => {
    it("should find transaction that was added", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            const has = storage.hasTransaction(transaction1.id);
            expect(has).toBe(true);
        } finally {
            storage.dispose();
        }
    });

    it("should not find transaction that wasn't added", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            const has = storage.hasTransaction(transaction2.id);
            expect(has).toBe(false);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.getAllTransactions", () => {
    it("should return all added transactions", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            storage.addTransaction(transaction2);
            const addedTransactions = Array.from(storage.getAllTransactions());
            expect(addedTransactions).toStrictEqual([transaction1, transaction2]);
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.addTransaction", () => {
    it("should add new transaction", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            const has = storage.hasTransaction(transaction1.id);
            expect(has).toBe(true);
        } finally {
            storage.dispose();
        }
    });

    it("should throw when adding same transaction twice", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            const check = () => storage.addTransaction(transaction1);
            expect(check).toThrow();
        } finally {
            storage.dispose();
        }
    });
});

describe("Storage.removeTransaction", () => {
    it("should remove previously added transaction", () => {
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
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
        configuration.getRequired.mockReturnValueOnce("database.db"); // storage
        const storage = container.resolve(Storage);
        storage.boot();

        try {
            storage.addTransaction(transaction1);
            storage.addTransaction(transaction2);
            storage.flush();
            const addedTransactions = Array.from(storage.getAllTransactions());
            expect(addedTransactions).toStrictEqual([]);
        } finally {
            storage.dispose();
        }
    });
});
