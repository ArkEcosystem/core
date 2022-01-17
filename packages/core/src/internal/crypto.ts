import { existsSync } from "fs-extra";
import { join } from "path";
import prompts from "prompts";

import { InvalidPassword, MissingConfigFile, PassphraseNotDetected } from "../exceptions/crypto";

// todo: review the implementation
export const buildBIP38 = async (flags, config?: string): Promise<Record<string, string | undefined>> => {
    if (!config && process.env.CORE_PATH_CONFIG) {
        config = process.env.CORE_PATH_CONFIG;
    }

    if (flags.bip39) {
        return { bip38: undefined, password: undefined };
    }

    // initial values
    let bip38 = flags.bip38 || process.env.CORE_FORGER_BIP38;
    let password = flags.password || process.env.CORE_FORGER_PASSWORD;
    const skipPrompts = flags.skipPrompts || false;

    if (bip38 && password) {
        return { bip38, password };
    }

    // @todo: update to follow new config convention
    const configDelegates = join(config!, "delegates.json");

    if (!existsSync(configDelegates)) {
        throw new MissingConfigFile(configDelegates);
    }

    const delegates = require(configDelegates);

    if (!bip38 && delegates.bip38) {
        bip38 = delegates.bip38;
    }

    if (!bip38 && !delegates.secrets?.length) {
        throw new PassphraseNotDetected();
    }

    if (bip38 && !password) {
        if (skipPrompts) {
            throw new InvalidPassword();
        }

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
            throw new InvalidPassword();
        }

        if (!response.confirm) {
            throw new Error("You'll need to confirm the password to continue.");
        }

        password = response.password;
    }

    if (bip38 && password) {
        flags.bip38 = bip38;
        flags.password = password;
    }

    return { bip38, password };
};
