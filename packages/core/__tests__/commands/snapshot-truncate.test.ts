import { Utils } from "@arkecosystem/core-cli";
import { Container } from "@arkecosystem/core-kernel";
import { Console, Sandbox } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-truncate";

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
let spyOnTerminate;

beforeEach(() => {
    cli = new Console();

    const sandbox = new Sandbox();

    mockSnapshotService = {
        truncate: jest.fn(),
    };

    sandbox.app.bind(Container.Identifiers.SnapshotService).toConstantValue(mockSnapshotService);

    jest.spyOn(Utils, "buildApplication").mockResolvedValue(sandbox.app);
    spyOnTerminate = jest.spyOn(sandbox.app, "terminate").mockImplementation(async () => {});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("SnapshotTruncateCommand", () => {
    it("should run truncate", async () => {
        await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.truncate).toHaveBeenCalled();
        expect(spyOnTerminate).toHaveBeenCalled();
    });
});
