import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/log-archived";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    files: jest
        .fn()
        .mockResolvedValue([
            `${process.env.HOME}/.pm2/logs/ark-core-out.log`,
            `${process.env.HOME}/.pm2/logs/ark-core-error.log`,
        ]),

    size: jest.fn().mockResolvedValue(1024),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationVersion).toConstantValue("dummyVersion");
    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

describe("Info:CoreVersion", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.archived");
    });

    it("should return file info", async () => {
        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result[0].size).toBe(1);
        expect(result[0].name).toBeString();
        expect(result[0].downloadLink).toBeString();
    });
});
