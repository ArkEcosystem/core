import { Services, Utils } from "@packages/core-cli";
import { Container } from "@packages/core-kernel";
import { Console, Sandbox } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-rollback";

let cli;
let mockSnapshotService;
let spyOnTerminate;

beforeEach(() => {
    cli = new Console();

    const sandbox = new Sandbox();

    mockSnapshotService = {
        rollbackByHeight: jest.fn(),
        rollbackByNumber: jest.fn(),
    };

    sandbox.app.bind(Container.Identifiers.SnapshotService).toConstantValue(mockSnapshotService);

    jest.spyOn(Utils, "buildApplication").mockResolvedValue(sandbox.app);
    spyOnTerminate = jest.spyOn(sandbox.app, "terminate").mockImplementation(async () => {});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("SnapshotRollbackCommand", () => {
    it("should run rollback by height", async () => {
        await expect(cli.withFlags({ height: 100 }).execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByHeight).toHaveBeenCalledWith(100);
        expect(spyOnTerminate).toHaveBeenCalled();
    });

    it("should run rollback by number", async () => {
        await expect(cli.withFlags({ number: 100 }).execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByNumber).toHaveBeenCalledWith(100);
        expect(spyOnTerminate).toHaveBeenCalled();
    });

    it("should not run rollback if height or number is not provided", async () => {
        const spyOnError = jest.spyOn(Services.Logger.prototype, "error");

        await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByNumber).not.toHaveBeenCalled();
        expect(mockSnapshotService.rollbackByHeight).not.toHaveBeenCalled();
        expect(spyOnError).toHaveBeenCalled();
        expect(spyOnTerminate).toHaveBeenCalled();
    });
});
