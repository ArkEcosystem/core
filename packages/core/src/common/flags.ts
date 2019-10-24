import { Networks } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";

import { CommandFlags } from "../types";

export const flagsNetwork: Record<string, object> = {
    token: flags.string({
        description: "the name of the token that should be used",
    }),
    network: flags.string({
        description: "the name of the network that should be used",
        options: Object.keys(Networks),
    }),
};

export const flagsBehaviour: Record<string, object> = {
    networkStart: flags.boolean({
        description: "indicate that this is the first start of seeds",
    }),
    disableDiscovery: flags.boolean({
        description: "permanently disable any peer discovery",
    }),
    skipDiscovery: flags.boolean({
        description: "skip the initial peer discovery",
    }),
    ignoreMinimumNetworkReach: flags.boolean({
        description: "ignore the minimum network reach on start",
    }),
    launchMode: flags.string({
        description: "the mode the relay will be launched in (seed only at the moment)",
    }),
};

export const flagsForger: Record<string, object> = {
    bip38: flags.string({
        description: "the encrypted bip38",
        dependsOn: ["password"],
    }),
    bip39: flags.string({
        description: "the plain text bip39 passphrase",
        exclusive: ["bip38", "password"],
    }),
    password: flags.string({
        description: "the password for the encrypted bip38",
        dependsOn: ["bip38"],
    }),
    suffix: flags.string({
        hidden: true,
        default: "forger",
    }),
};

export const flagsSnapshot: Record<string, object> = {
    ...flagsNetwork,
    skipCompression: flags.boolean({
        description: "skip gzip compression",
    }),
    trace: flags.boolean({
        description: "dumps generated queries and settings to console",
    }),
    suffix: flags.string({
        hidden: true,
        default: "snapshot",
    }),
};

export const flagsToStrings = (flags: CommandFlags, ignoreKeys: string[] = []): string => {
    const mappedFlags: string[] = [];

    for (const [key, value] of Object.entries(flags)) {
        if (!ignoreKeys.includes(key) && value !== undefined) {
            if (value === true) {
                mappedFlags.push(`--${key}`);
            } else if (typeof value === "string") {
                mappedFlags.push(value.includes(" ") ? `--${key}="${value}"` : `--${key}=${value}`);
            } else {
                mappedFlags.push(`--${key}=${value}`);
            }
        }
    }

    return mappedFlags.join(" ");
};
