import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { SnapshotsManager } from "../snapshots/snapshots-manager";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "snapshots.create";

    public schema = {
        type: "object",
        properties: {
            codec: {
                type: "string",
            },
            skipCompression: {
                type: "boolean",
            },
            start: {
                type: "number",
            },
            end: {
                type: "number",
            },
        },
    };

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Identifiers.SnapshotsManager)
    private readonly snapshotManager!: SnapshotsManager;

    public async execute(params: any): Promise<any> {
        await this.snapshotManager.dump({
            network: this.app.network(),
            ...params,
        });

        return {};
    }
}
