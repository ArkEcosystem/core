import { container } from "./mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { ConnectionManager } from "../../../packages/core-transaction-pool/src/manager";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { Connection } from "./__stubs__/connection";

describe("Transaction Pool Manager", () => {
    let manager: ConnectionManager;
    let maxTransactionAge: number;
    let args;

    beforeAll(() => {
        manager = new ConnectionManager();
        maxTransactionAge = 2700;

        container.app.resolvePlugin("database").walletManager = new Wallets.WalletManager();

        args = {
            options: defaults,
            walletManager: new WalletManager(),
            memory: new Memory(maxTransactionAge),
            storage: new Storage(),
        };
    });

    describe("connection", () => {
        it("should return the drive-connection", async () => {
            await manager.createConnection(new Connection(args));

            expect(manager.connection()).toBeInstanceOf(Connection);
        });

        it("should return the drive-connection for a different name", async () => {
            await manager.createConnection(new Connection(args), "testing");

            expect(manager.connection("testing")).toBeInstanceOf(Connection);
        });
    });
});
