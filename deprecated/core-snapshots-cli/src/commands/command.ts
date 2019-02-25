import Command, { flags } from "@oclif/command";

export abstract class BaseCommand extends Command {
    public static flags = {
        data: flags.string({
            description: "data directory",
        }),
        config: flags.string({
            description: "network config",
        }),
        token: flags.string({
            description: "token name",
            default: "ark",
        }),
        network: flags.string({
            description: "token network",
        }),
        skipCompression: flags.boolean({
            description: "skip gzip compression",
        }),
        trace: flags.boolean({
            description: "dumps generated queries and settings to console",
        }),
    };
}
