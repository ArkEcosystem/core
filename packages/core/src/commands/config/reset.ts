import { flags } from "@oclif/command";
import fs from "fs-extra";
import prompts from "prompts";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
import { PublishCommand } from "./publish";

export class ResetCommand extends BaseCommand {
    public static description: string = "Reset the configuration";

    public static examples: string[] = [
        `Reset the configuration for the mainnet network
$ ark config:reset --network=mainnet
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(ResetCommand);

        if (flags.network) {
            return this.performReset(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "Are you absolutely sure that you want to reset the configuration?",
            },
        ]);

        if (response.confirm) {
            return this.performReset(flags);
        }
    }

    private async performReset(flags: CommandFlags): Promise<void> {
        const { config } = await this.getPaths(flags);

        this.addTask("Remove configuration", async () => {
            fs.removeSync(config);
        });

        await this.runTasks();

        await PublishCommand.run(this.flagsToStrings(flags).split(" "));
    }
}
