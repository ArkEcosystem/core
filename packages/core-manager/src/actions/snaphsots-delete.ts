import { Container, Contracts } from "@arkecosystem/core-kernel";
import { join } from "path";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "snapshots.delete";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
        },
        required: ["name"],
    };

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public async execute(params: { name: string }): Promise<any> {
        await this.deleteSnapshot(params.name);

        return {};
    }

    public async deleteSnapshot(name: string): Promise<void> {
        const snapshotsDir = `${process.env.CORE_PATH_DATA}/snapshots/`;
        const snapshotPath = join(snapshotsDir, name);

        if (!(await this.filesystem.exists(snapshotPath))) {
            throw new Error("Snapshot not found");
        }

        if (!(await this.filesystem.delete(snapshotPath))) {
            throw new Error("Cannot delete snapshot");
        }
    }
}
