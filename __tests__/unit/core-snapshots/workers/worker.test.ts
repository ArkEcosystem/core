import "jest-extended";

import { Transactions as CryptoTransactions } from "@packages/core-magistrate-crypto";
import { DumpWorkerAction } from "@packages/core-snapshots/src/workers/actions/dump-worker-action";
import { dispose, init } from "@packages/core-snapshots/src/workers/worker";
import { Transactions } from "@packages/crypto";

jest.mock("worker_threads", () => {
    return {
        workerData: {
            actionOptions: {
                action: "dump",
                table: "blocks",
                start: 1,
                end: 100,
                codec: "default",
                skipCompression: false,
                filePath: "",
                updateStep: 1000,
            },
            cryptoPackages: ["@arkecosystem/core-magistrate-crypto"],
            networkConfig: require("@packages/crypto").Managers.configManager.all(),
        },
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Worker", () => {
    it("should run worker and register crypto packages", async () => {
        const spyOnRegisterTransactionType = jest.spyOn(Transactions.TransactionRegistry, "registerTransactionType");

        DumpWorkerAction.prototype.start = jest.fn();

        await expect(init()).toResolve();
        await expect(dispose()).toResolve();

        for (const transaction of Object.values(CryptoTransactions)) {
            expect(spyOnRegisterTransactionType).toHaveBeenCalledWith(transaction);
        }
    });
});
