import "jest-extended";
import { Sandbox } from "@packages/core-test-framework/src";
import { Container } from "@packages/core-kernel";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { ProgressRenderer } from "@packages/core/src/utils/snapshot-progress-renderer";
import { SnapshotApplicationEvents } from "@packages/core-snapshots";


let sandbox: Sandbox;
let eventDispatcher: MemoryEventDispatcher;

let mockOra;

beforeEach(() => {
    mockOra = {
        render: jest.fn()
    }

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).to(MemoryEventDispatcher).inSingletonScope();

    eventDispatcher = sandbox.app.get<MemoryEventDispatcher>(Container.Identifiers.EventDispatcherService);
})

afterEach(() => {
    jest.clearAllMocks();
})

describe("SnapshotProgressRenderer", () => {
    it("should render on start", async () => {
        new ProgressRenderer(mockOra as any, sandbox.app);

        await eventDispatcher.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: "blocks",
            count: 100
        });

        expect(mockOra.render).toHaveBeenCalledTimes(1);
    })

    it("should render on update", async () => {
        new ProgressRenderer(mockOra as any, sandbox.app);

        await eventDispatcher.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: "blocks",
            count: 100
        });

        await eventDispatcher.dispatch(SnapshotApplicationEvents.SnapshotProgress, {
            table: "blocks",
            value: 10
        });

        expect(mockOra.render).toHaveBeenCalledTimes(2);
    })

    it("should render on end", async () => {
        new ProgressRenderer(mockOra as any, sandbox.app);

        await eventDispatcher.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: "blocks",
            count: 100
        });

        await eventDispatcher.dispatch(SnapshotApplicationEvents.SnapshotComplete, {
            table: "blocks"
        });

        expect(mockOra.render).toHaveBeenCalledTimes(2);
    })
});
