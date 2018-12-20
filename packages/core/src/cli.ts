import cli, { Command } from "commander";

export class CLI {
    private cli: Command;

    private options: Array<[string, string, any]> = [
        // Configuration
        ["-d, --data <data>", "core data directory", "~/.ark"],
        ["-c, --config <config>", "core configuration location", "~/.ark/config"],
        ["-n, --network <network>", "token network", null],
        ["-r, --remote <remote>", "remote peer for configuration", null],
        // Forger (Delegates only)
        ["-fb, --forger-bip38 <forger-bip38>", "forger bip38", null],
        ["-fp, --forger-bip39 <forger-bip39>", "forger bip39", null],
        // Modify certain behaviours
        ["--network-start", "force genesis network start", false],
        ["--disable-discovery", "disable any peer discovery", null],
        ["--skip-discovery", "skip the initial peer discovery", null],
        ["--ignore-minimum-network-reach", "skip the network reach check", null],
        // Presets & Modes
        ["--launch-mode <mode>", "the application configuration mode", null],
        ["--preset <preset>", "zero-configuration preset", null],
        // CLI Modes
        ["--i, --interactive", "provide an interactive UI", true],
    ];

    constructor(readonly version: string) {
        this.cli = cli;
    }

    public add(name: string, description: string, handler: any, action: string = "handle"): CLI {
        const command = this.cli.command(name).description(description);

        for (const [flag, flagDesc, defaultValue] of this.options) {
            command.option(flag, flagDesc, defaultValue);
        }

        command.action(async options => {
            return new handler(options)[action]();
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
