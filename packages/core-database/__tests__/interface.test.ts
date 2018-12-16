import "jest-extended";

import { setUp, tearDown } from "./__support__/setup";

let connectionInterface;

import { DelegatesRepository } from "../src/repositories/delegates";
import { WalletsRepository } from "../src/repositories/wallets";
import { WalletManager } from "../src/wallet-manager";
import { DummyConnection } from "./__fixtures__/dummy-class";

beforeAll(async () => {
    await setUp();

    connectionInterface = new DummyConnection({});
});

afterAll(async () => {
    await tearDown();
});

describe("Connection Interface", () => {
    describe("getConnection", () => {
        it("should return the set connection", () => {
            connectionInterface.connection = "fake-connection";

            expect(connectionInterface.getConnection()).toBe("fake-connection");
        });
    });

    describe("_registerWalletManager", () => {
        it("should register the wallet manager", () => {
            expect(connectionInterface.walletManager).toBeNull();

            connectionInterface._registerWalletManager();

            expect(connectionInterface.walletManager).toBeInstanceOf(WalletManager);
        });
    });

    describe("_registerRepositories", () => {
        it("should register the repositories", async () => {
            expect(connectionInterface.wallets).toBeNull();
            expect(connectionInterface.delegates).toBeNull();

            connectionInterface._registerRepositories();

            expect(connectionInterface.wallets).toBeInstanceOf(WalletsRepository);
            expect(connectionInterface.delegates).toBeInstanceOf(DelegatesRepository);
        });
    });
});
