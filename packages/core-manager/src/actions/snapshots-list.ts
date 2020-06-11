import { Container, Contracts } from "@arkecosystem/core-kernel";
import { basename, join } from "path";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "snapshots.list";

    public async execute(params: object): Promise<any> {
        return await this.getSnapshots();
    }

    private async getSnapshotInfo(snapshot: string): Promise<any> {
        const response = {
            name: basename(snapshot),
            size: 0,
        };

        for (const file of ["blocks", "transactions", "rounds", "meta.json"]) {
            response.size += await this.filesystem.size(join(snapshot, file));
        }

        response.size = Math.round(response.size / 1024);

        return response;
    }

    private async getSnapshots(): Promise<any[]> {
        const snapshotsDir = `${process.env.CORE_PATH_DATA}/snapshots/`;

        const snapshots = await this.filesystem.directories(snapshotsDir);

        const response = [] as any[];

        for (const snapshot of snapshots) {
            try {
                response.push(await this.getSnapshotInfo(snapshot));
            } catch {}
        }

        return response;
    }
}
