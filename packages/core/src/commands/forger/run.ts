import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import Command from "../command";

export class ForgerRun extends Command {
    public static description = "Run the forger (no daemon)";

    public static examples = [`$ ark forger:run`];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(ForgerRun);

        return this.buildApplication(app, {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-winston",
                "@arkecosystem/core-forger",
            ],
            options: {
                "@arkecosystem/core-forger": {
                    bip38: flags.bip38,
                    password: flags.password,
                },
            },
        });
    }
}
