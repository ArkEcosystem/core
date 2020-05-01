import { Container, Contracts } from "@arkecosystem/core-kernel";

import { SnapshotApplicationEvents } from "./events";

@Container.injectable()
export class ProgressDispatcher {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    private table: string = "";
    private count: number = 0;

    public async start(table: string, count: number): Promise<void> {
        this.table = table;
        this.count = count;

        await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: this.table,
            count: this.count,
        });
    }

    public async update(count: number): Promise<void> {
        await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotProgress, {
            table: this.table,
            value: count,
        });
    }

    public async end(): Promise<void> {
        await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotComplete, {
            table: this.table,
        });
    }
}
