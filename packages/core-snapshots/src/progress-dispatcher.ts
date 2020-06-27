import { Container, Contracts } from "@arkecosystem/core-kernel";

import { SnapshotApplicationEvents } from "./events";

@Container.injectable()
export class ProgressDispatcher {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    private table: string = "";
    private count: number = 0;

    public async start(table: string, count: number): Promise<void> {
        this.table = table;
        this.count = count;

        await this.events.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: this.table,
            count: this.count,
        });
    }

    public async update(count: number): Promise<void> {
        await this.events.dispatch(SnapshotApplicationEvents.SnapshotProgress, {
            table: this.table,
            value: count,
        });
    }

    public async end(): Promise<void> {
        await this.events.dispatch(SnapshotApplicationEvents.SnapshotComplete, {
            table: this.table,
        });
    }
}
