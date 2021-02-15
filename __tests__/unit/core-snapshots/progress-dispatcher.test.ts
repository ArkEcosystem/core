import "jest-extended";

import { Container, Contracts } from "@packages/core-kernel";
import { SnapshotApplicationEvents } from "@packages/core-snapshots/src";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { ProgressDispatcher } from "@packages/core-snapshots/src/progress-dispatcher";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let progressDispatcher: ProgressDispatcher;
const eventDispatcher: Partial<Contracts.Kernel.EventDispatcher> = {
    dispatch: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);

    sandbox.app.bind(Identifiers.ProgressDispatcher).to(ProgressDispatcher);

    progressDispatcher = sandbox.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);
});

describe("ProgressDispatcher", () => {
    it("should dispatch start, end and update events", async () => {
        const table = "blocks";
        const count = 3;

        await progressDispatcher.start(table, count);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(SnapshotApplicationEvents.SnapshotStart, {
            table,
            count,
        });

        await progressDispatcher.update(2);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(SnapshotApplicationEvents.SnapshotProgress, {
            table,
            value: 2,
        });

        await progressDispatcher.end();
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(SnapshotApplicationEvents.SnapshotComplete, { table });
    });
});
