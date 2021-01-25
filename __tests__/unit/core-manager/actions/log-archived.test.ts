import "jest-extended";

import { Container, Providers } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/log-archived";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";
import { pathExistsSync } from "fs-extra";
import { v4 } from "public-ip";
import { dirSync, setGracefulCleanup } from "tmp";

jest.mock("fs-extra");
jest.mock("public-ip");

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
    sandbox.app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .set("server.ip", "127.0.0.1");
    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .set("server.http.port", 4005);
    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .set("server.https.port", 8445);

    action = sandbox.app.resolve(Action);
});

afterAll(() => {
    delete process.env.CORE_PATH_DATA;
});

describe("Info:CoreVersion", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.archived");
    });

    it("should return empty array if folder doesn't exist", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(false);

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(0);
    });

    it("should return file info using HTTP server", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(true);

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(1);
        expect(result[0].size).toBe(1);
        expect(result[0].name).toBe("2020-12-14_17-38-00.log.gz");
        expect(result[0].downloadLink).toBe("http://127.0.0.1:4006/log/archived/2020-12-14_17-38-00.log.gz");
    });

    it("should return file info using HTTPS server", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(true);
        sandbox.app.bind(Identifiers.HTTPS_JSON_RPC).toConstantValue({});

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(1);
        expect(result[0].size).toBe(1);
        expect(result[0].name).toBe("2020-12-14_17-38-00.log.gz");
        expect(result[0].downloadLink).toBe("https://127.0.0.1:8446/log/archived/2020-12-14_17-38-00.log.gz");
    });

    it("should obtain public IP if IP is not set", async () => {
        // @ts-ignore
        pathExistsSync.mockReturnValue(true);
        // @ts-ignore
        v4.mockReturnValue("127.0.0.5");

        sandbox.app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).unset("server.ip");

        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(1);
        expect(result[0].size).toBe(1);
        expect(result[0].name).toBe("2020-12-14_17-38-00.log.gz");
        expect(result[0].downloadLink).toBe("http://127.0.0.5:4006/log/archived/2020-12-14_17-38-00.log.gz");
    });
});
