import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class SnapshotsManager {
    @Container.inject(Container.Identifiers.SnapshotService)
    private readonly snapshotService!: Contracts.Snapshot.SnapshotService;

    private processInAction?: string;

    // TODO: Contracts.Snapshot.DumpOptions
    public async start(name: string, options: any): Promise<void> {
        if (this.processInAction) {
            throw new Error(`Process ${this.processInAction} is executing`);
        }

        this.processInAction = name;

        this.snapshotService.dump(options).finally(() => {
            this.processInAction = undefined;
        });
    }
}
