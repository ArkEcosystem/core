import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/log-archived";
import { Sandbox } from "@packages/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";
import { pathExistsSync } from "fs-extra";

jest.mock("fs-extra");

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    files: jest.fn().mockResolvedValue([`${process.env.CORE_PATH_DATA}/log-archive/2020-12-14_17-38-00.log.gz`]),

    size: jest.fn().mockResolvedValue(1024),
};

beforeEach(() => {
    setGracefulCleanup();

    process.env.CORE_PATH_DATA = dirSync().name;

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationVersion).toConstantValue("dummyVersion");
    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

afterAll(() => {
    delete process.env.CORE_PATH_DATA;
});

describe("Info:CoreVersion", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.archived");
    });

    it("should return file info", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(true);

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(1);
        expect(result[0].size).toBe(1);
        expect(result[0].name).toBe("2020-12-14_17-38-00.log.gz");
        expect(result[0].downloadLink).toBe("/log/archived/2020-12-14_17-38-00.log.gz");
    });

    it("should return empty array if folder doesn't exist", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(false);

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(0);
    });
});
