import { existsSync } from "fs-extra";
import { join } from "path";
import prompts from "prompts";

import { CommandFlags } from "../types";
import { abort } from "./cli";
import { getPaths } from "./env";

export const buildBIP38 = async (flags: CommandFlags): Promise<Record<string, string>> => {
    if (flags.bip39) {
        return { bip38: undefined, password: undefined };
    }

    // initial values
    let bip38 = flags.bip38 || process.env.CORE_FORGER_BIP38;
    let password = flags.password || process.env.CORE_FORGER_PASSWORD;

    if (bip38 && password) {
        return { bip38, password };
    }

    // config
    const { config } = getPaths(flags.token, flags.network);

    // @todo: update to follow new config convention
    const configDelegates = join(config, "delegates.json");

    if (!existsSync(configDelegates)) {
        abort(`The ${configDelegates} file does not exist.`);
    }

    const delegates = require(configDelegates);

    if (!bip38 && delegates.bip38) {
        bip38 = delegates.bip38;
    }

    if (!bip38 && !delegates.secrets.length) {
        abort("We were unable to detect a BIP38 or BIP39 passphrase.");
    }

    // fallback
    if (bip38 && !password) {
        const response = await prompts([
            {
                type: "password",
                name: "password",
                message: "Please enter your BIP38 password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.password) {
            abort("We've detected that you are using BIP38 but have not provided a valid password.");
        }

        if (!response.confirm) {
            abort("You'll need to confirm the password to continue.");
        }

        password = response.password;
    }

    if (bip38 && password) {
        flags.bip38 = bip38;
        flags.password = password;
    }

    return { bip38, password };
};
