import { Utils } from "@packages/core-cli";
import { Container } from "@packages/core-kernel";
import { Console, Sandbox } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-dump";

jest.mock("@packages/core-cli", () => {
    const originalModule = jest.requireActual("@packages/core-cli");

    return {
        __esModule: true,
        ...originalModule,
        Utils: {
            ...originalModule.Utils,
            buildApplication: jest.fn(),
        },
    };
});

let cli;
let mockSnapshotService;
let mockEventListener;
let spyOnTerminate;
let spyOnBuildApplication;

beforeEach(() => {
    cli = new Console();

    const sandbox = new Sandbox();

    mockSnapshotService = {
        dump: jest.fn(),
    };

    mockEventListener = {
        listen: jest.fn(),
    };

    sandbox.app.bind(Container.Identifiers.SnapshotService).toConstantValue(mockSnapshotService);
    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventListener);

    spyOnBuildApplication = jest.spyOn(Utils, "buildApplication").mockResolvedValue(sandbox.app);
    spyOnTerminate = jest.spyOn(sandbox.app, "terminate").mockImplementation(async () => {});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("DumpCommand", () => {
    it("should run dump", async () => {
        await expect(cli.execute(Command)).toResolve();
        expect(spyOnBuildApplication).toHaveBeenCalled();
        expect(mockSnapshotService.dump).toHaveBeenCalled();
        expect(spyOnTerminate).toHaveBeenCalled();
    });
});
