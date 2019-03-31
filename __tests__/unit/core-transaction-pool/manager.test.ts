import "jest-extended";
import { ConnectionManager } from "../../../packages/core-transaction-pool/src/manager";
import { Connection } from "./__stubs__/connection";

const manager = new ConnectionManager();

describe("Transaction Pool Manager", () => {
    describe("connection", () => {
        it("should return the drive-connection", async () => {
            await manager.createConnection(new Connection());

            expect(manager.connection()).toBeInstanceOf(Connection);
        });

        it("should return the drive-connection for a different name", async () => {
            await manager.createConnection(new Connection(), "testing");

            expect(manager.connection("testing")).toBeInstanceOf(Connection);
        });
    });
});
