import cli, { Command } from "commander";
import { Validator } from "./services/validator";

export class CLI {
    private cli: Command;

    private options: Array<[string, string]> = [
        // Configuration
        ["-d, --data <data>", "core data directory"],
        ["-c, --config <config>", "core configuration location"],
        ["-n, --network <network>", "token network"],
        ["-r, --remote <remote>", "remote peer for configuration"],
        // Forger (Delegates only)
        ["-fb, --forger-bip38 <forger-bip38>", "forger bip38"],
        ["-fp, --forger-bip39 <forger-bip39>", "forger bip39"],
        // Modify certain behaviours
        ["--network-start", "force genesis network start"],
        ["--disable-discovery", "disable any peer discovery"],
        ["--skip-discovery", "skip the initial peer discovery"],
        ["--ignore-minimum-network-reach", "skip the network reach check"],
        // Presets & Modes
        ["--launch-mode <mode>", "the application configuration mode"],
        ["--preset <preset>", "zero-configuration preset"],
        // CLI Modes
        ["--i, --interactive", "provide an interactive UI"],
    ];

    constructor(readonly version: string) {
        this.cli = cli;
    }

    public add(name: string, description: string, handler: any, action: string = "handle"): CLI {
        const command = this.cli.command(name).description(description);

        for (const [flag, flagDesc] of this.options) {
            command.option(flag, flagDesc);
        }

        command.action(async options => {
            const { value, error } = Validator.validate(options);

            if (error) {
                console.error(error.details[0].message);
                process.exit(1);
            }

            return new handler(value)[action]();
        });

        return this;
    }

    public launch(): void {
        this.cli.version(this.version);

        this.cli.command("*").action(env => {
            this.cli.help();
            process.exit(0);
        });

        this.cli.parse(process.argv);
    }
}
