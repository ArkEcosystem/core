import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class SnapshotsManager {
    @Container.inject(Container.Identifiers.SnapshotService)
    private readonly snapshotService!: Contracts.Snapshot.SnapshotService;

    private processInAction?: string;

    public async dump(options: Contracts.Snapshot.DumpOptions): Promise<void> {
        if (this.processInAction) {
            throw new Error(`Process ${this.processInAction} is executing`);
        }

        this.processInAction = "create";

        this.snapshotService.dump(options).finally(() => {
            this.processInAction = undefined;
        });
    }

    public async restore(options: Contracts.Snapshot.RestoreOptions): Promise<void> {
        if (this.processInAction) {
            throw new Error(`Process ${this.processInAction} is executing`);
        }

        this.processInAction = "restore";

        this.snapshotService.restore(options).finally(() => {
            this.processInAction = undefined;
        });
    }
}
