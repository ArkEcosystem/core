import { app, Container } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import Command, { flags } from "@oclif/command";

import { abort } from "../../common/cli";
import { flagsSnapshot } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { chooseSnapshot, setUpLite } from "../../common/snapshot";
import { CommandFlags } from "../../types";

export class VerifyCommand extends Command {
    public static description = "check validity of specified snapshot";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        blocks: flags.string({
            description: "blocks to verify, correlates to folder name",
        }),
        verifySignatures: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        const { flags, paths } = await parseWithNetwork(this.parse(VerifyCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            abort("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (!flags.blocks) {
            flags.blocks = await chooseSnapshot(paths.data, "What snapshot do you want to verify?");
        }

        await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).verify(flags);
    }
}
