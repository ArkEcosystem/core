import { app } from "@arkecosystem/core-container";
import { AbstractRunCommand } from "../../shared/run";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RunCommand extends AbstractRunCommand {
    public static description: string = "Run the forger (without pm2)";

    public static examples: string[] = [
        `Run a forger with a bip39 passphrase
$ ark forger:run --bip39="..."
`,
        `Run a forger with an encrypted bip38
$ ark forger:run --bip38="..." --password="..."
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsForger,
    };

    public async run(): Promise<void> {
        const flags = await super.getFlags();

        await this.buildApplication(app, flags, {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-pino",
                "@arkecosystem/core-forger",
            ],
            options: {
                "@arkecosystem/core-forger": await this.buildBIP38(flags),
            },
        });
    }

    protected getSuffix(): string {
        return "relay";
    }

    protected getClass() {
        return RunCommand;
    }
}
