import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/log-download";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let logDatabaseService;
let workerManager;

beforeEach(() => {
    logDatabaseService = {
        getDBFilePath: jest.fn().mockReturnValue("path/to/db"),
        getSchema: jest.fn().mockReturnValue({}),
    };

    workerManager = {
        canRun: jest.fn().mockReturnValue(true),
        generateLog: jest.fn().mockResolvedValue("archive.zip"),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.LogsDatabaseService).toConstantValue(logDatabaseService);
    sandbox.app.bind(Identifiers.WorkerManager).toConstantValue(workerManager);

    action = sandbox.app.resolve(Action);
});

describe("Log:Download", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.download");
    });

    it("should return file name and call generateLog", async () => {
        const result = await action.execute({ dateFrom: 1607786170, dateTo: 1607948405, levels: ["info", "debug"] });

        // @ts-ignore
        const query = {
            $order: { id: "ASC" },
            level: { $in: ["info", "debug"] },
            timestamp: { $gte: 1607786170, $lte: 1607948405 },
        };

        expect(result).toEqual("archive.zip");
        expect(workerManager.generateLog).toHaveBeenCalledWith("path/to/db", {}, query);
    });

    it("should return file name and call generateLog with included process names", async () => {
        const result = await action.execute({
            dateFrom: 1607786170,
            dateTo: 1607948405,
            levels: ["info", "debug"],
            processes: ["core", "forger"],
        });

        const query = {
            $order: { id: "ASC" },
            level: { $in: ["info", "debug"] },
            process: { $in: ["core", "forger"] },
            timestamp: { $gte: 1607786170, $lte: 1607948405 },
        };

        expect(result).toEqual("archive.zip");
        expect(workerManager.generateLog).toHaveBeenCalledWith("path/to/db", {}, query);
    });

    it("should throw error if another log process is running", async () => {
        workerManager.canRun = jest.fn().mockReturnValue(false);

        await expect(
            action.execute({
                dateFrom: 1607786170,
                dateTo: 1607948405,
                levels: ["info", "debug"],
            }),
        ).rejects.toThrowError("Previous log generation is still in progress.");
    });
});
