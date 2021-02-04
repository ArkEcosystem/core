import "jest-extended";

import { Container, Providers } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { WorkerManager } from "@packages/core-manager/src/workers/worker-manager";
import { EventEmitter } from "events";
import { Worker } from "worker_threads";

jest.mock("worker_threads");

let mockWorker;
let workerManager: WorkerManager;

let sandbox: Sandbox;
const mockConfiguration = {
    archiveFormat: "zip",
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .from("@arkecosystem/core-manager", mockConfiguration);

    workerManager = sandbox.app.resolve(WorkerManager);

    mockWorker = new EventEmitter();
    mockWorker.new = jest.fn();

    // @ts-ignore
    Worker.mockImplementation(() => {
        return mockWorker;
    });
});

describe("WorkerManager", () => {
    describe("canRun", () => {
        it("should return true if worker is not running", async () => {
            expect(workerManager.canRun()).toBeTruthy();
        });

        it("should return false if worker is running", async () => {
            // @ts-ignore
            workerManager.runningWorkers++;

            expect(workerManager.canRun()).toBeFalsy();
        });
    });

    describe("generateLog", () => {
        it("should resolve if worker exit without error using archiveFormat === zip", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {});

            mockWorker.emit("exit");

            await expect(promise).resolves.toInclude("zip");
            await expect(Worker).toHaveBeenCalledWith(expect.toBeString(), {
                workerData: {
                    archiveFormat: "zip",
                    databaseFilePath: "/path/to/db",
                    logFileName: expect.toInclude("zip"),
                    query: {},
                    schema: { tables: [] },
                },
            });
        });

        it("should resolve if worker exit without error using archiveFormat === gz", async () => {
            mockConfiguration.archiveFormat = "gz";
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {});

            mockWorker.emit("exit");

            await expect(promise).resolves.toInclude("log.gz");
            await expect(Worker).toHaveBeenCalledWith(expect.toBeString(), {
                workerData: {
                    archiveFormat: "gz",
                    databaseFilePath: "/path/to/db",
                    logFileName: expect.toInclude("log.gz"),
                    query: {},
                    schema: { tables: [] },
                },
            });
        });

        it("should reject if worker throws error", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {});

            mockWorker.emit("error", new Error("Test error"));

            await expect(promise).rejects.toThrowError("Test error");
        });

        it("should reject only once", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {});

            mockWorker.emit("error", new Error("Test error"));
            mockWorker.emit("error", new Error("Test error"));
            mockWorker.emit("exit");

            await expect(promise).rejects.toThrowError("Test error");
        });
    });
});
