import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { SnapshotApplicationEvents } from "./events";

@Container.injectable()
export class ProgressDispatcher {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-snapshots")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    private updateStep: number = 0;
    private counter: number = 0;

    private table: string = "";
    private count: number = 0;


    public async start (table: string, count: number): Promise<void> {
        this.updateStep = this.configuration.getOptional("dispatchUpdateStep", 1000);
        this.counter = 0;

        this.table = table;
        this.count = count;

        await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotStart, {
            table: this.table,
            count: this.count
        })
    }

    public async update(): Promise<void> {
        this.counter++;

        if (this.counter % this.updateStep === 0) {
            await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotProgress, {
                table: this.table,
                value: this.counter
            })
        }
    }

    public async end (): Promise<void> {
        await this.emitter.dispatch(SnapshotApplicationEvents.SnapshotComplete, {
            table: this.table
        })
    }
}
