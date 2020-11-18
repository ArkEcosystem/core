import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/log-log";
import { Sandbox } from "@packages/core-test-framework";
import fs from "fs";
import readline from "readline";

let sandbox: Sandbox;
let action: Action;

let logs;
let mockFilesystem;
let mockReadline;

beforeEach(() => {
    logs = [
        "[2020-11-17 14:11:50.689] [32mINFO [39m: [36mConnecting to database: ark_testnet[39m\n",
        "[2020-11-17 14:11:50.796] [34mDEBUG[39m: [36mConnection established.[39m\n",
        "[2020-11-18 14:11:51.238] [32mINFO [39m: [36mP2P Server P2P server started at http://127.0.0.1:4000[39m\n",
    ];

    mockFilesystem = {
        exists: jest.fn().mockReturnValue(true),
    };

    mockReadline = {
        [Symbol.asyncIterator]() {
            let i = 0;

            return {
                async next() {
                    if (i < logs.length) {
                        return { value: logs[i++] };
                    }
                    return { done: true };
                },
            };
        },
        close: jest.fn(),
    };

    // @ts-ignore
    jest.spyOn(readline, "createInterface").mockReturnValue(mockReadline);
    jest.spyOn(fs, "createReadStream").mockImplementation();

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

describe("Log:Log", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.log");
    });

    it("should throw when log does not exist", async () => {
        mockFilesystem.exists.mockReturnValue(false);

        // @ts-ignore
        await expect(action.execute({})).rejects.toThrowError("Cannot find log file");
    });

    it("should return array of lines", async () => {
        // @ts-ignore
        const result = await action.execute({});

        await expect(result).toBeArray();
        await expect(result.length).toEqual(3);
    });

    it("should filter lines by log level", async () => {
        // @ts-ignore
        const result = await action.execute({ logLevel: "info" });

        await expect(result).toBeArray();
        await expect(result.length).toEqual(2);
    });

    it("should filter lines by dateFrom", async () => {
        // @ts-ignore
        const result = await action.execute({ dateFrom: 1605657600 });

        await expect(result).toBeArray();
        await expect(result.length).toEqual(1);
    });

    it("should filter lines by dateTo", async () => {
        // @ts-ignore
        const result = await action.execute({ dateTo: 1605657600 });

        await expect(result).toBeArray();
        await expect(result.length).toEqual(2);
    });

    it("should limit response to 100 lines", async () => {
        logs = new Array(200).fill(logs).flat();

        // @ts-ignore
        const result = await action.execute();

        await expect(result).toBeArray();
        await expect(result.length).toEqual(100);
    });
});
