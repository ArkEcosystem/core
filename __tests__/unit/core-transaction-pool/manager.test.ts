import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { ConnectionManager } from "../../../packages/core-transaction-pool/src/manager";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { Connection } from "./__stubs__/connection";

const manager: ConnectionManager = new ConnectionManager();

const args = {
    options: defaults,
    walletManager: new WalletManager(),
    memory: new Memory(),
    storage: new Storage(),
};

describe("Transaction Pool Manager", () => {
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
