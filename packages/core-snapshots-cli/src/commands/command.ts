import { networks } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";

const validNetworks = Object.keys(networks).filter(network => network !== "unitnet");

export abstract class BaseCommand extends Command {
    public static flags = {
        token: flags.string({
            description: "the name of the token that should be used",
            default: "ark",
        }),
        network: flags.string({
            description: "the name of the network that should be used",
            options: validNetworks,
        }),
        skipCompression: flags.boolean({
            description: "skip gzip compression",
        }),
        trace: flags.boolean({
            description: "dumps generated queries and settings to console",
        }),
    };
}
