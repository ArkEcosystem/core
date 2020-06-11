import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { join } from "path";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { SnapshotsManager } from "../snapshots/snapshots-manager";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Identifiers.SnapshotsManager)
    private readonly snapshotManager!: SnapshotsManager;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "snapshots.restore";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
            truncate: {
                type: "boolean",
            },
            verify: {
                type: "boolean",
            },
        },
    };

    public async execute(params: { name: string; truncate?: boolean; verify?: boolean }): Promise<any> {
        const snapshotsDir = `${process.env.CORE_PATH_DATA}/snapshots/`;
        const snapshotPath = join(snapshotsDir, params.name);

        if (!(await this.filesystem.exists(snapshotPath))) {
            throw new Error("Snapshot not found");
        }

        await this.snapshotManager.restore({
            network: this.app.network(),
            blocks: params.name,
            ...params,
        });

        return {};
    }
}
