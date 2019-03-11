import { flags } from "@oclif/command";
import prompts from "prompts";
import { CommandFlags } from "../../../types";
import { BaseCommand } from "../../command";
import { BIP38Command } from "./bip38";
import { BIP39Command } from "./bip39";

export class ForgerCommand extends BaseCommand {
    public static description: string = "Configure the forging delegate";

    public static examples: string[] = [
        `Configure a delegate using an encrypted BIP38
$ ark config:forger --method=bip38
`,
        `Configure a delegate using a BIP39 passphrase
$ ark config:forger --method=bip39
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsForger,
        method: flags.string({
            description: "the configuration method to use (bip38 or bip39)",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(ForgerCommand);

        if (flags.method === "bip38") {
            return BIP38Command.run(this.formatFlags(flags));
        }

        if (flags.method === "bip39") {
            return BIP39Command.run(this.formatFlags(flags));
        }

        // Interactive CLI
        let response = await prompts([
            {
                type: "select",
                name: "method",
                message: "What method would you like to use to store your passphrase?",
                choices: [
                    { title: "Encrypted BIP38 (Recommended)", value: "bip38" },
                    { title: "Plain BIP39", value: "bip39" },
                ],
            },
        ]);

        if (!response.method) {
            this.abortWithInvalidInput();
        }

        response = { ...flags, ...response };

        if (response.method === "bip38") {
            return BIP38Command.run(this.formatFlags(response));
        }

        if (response.method === "bip39") {
            return BIP39Command.run(this.formatFlags(response));
        }
    }

    private formatFlags(flags): string[] {
        delete flags.method;

        return this.flagsToStrings(flags).split(" ");
    }
}
