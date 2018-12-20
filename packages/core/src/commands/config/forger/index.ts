import prompts from "prompts";
import { performBIP38Configuration } from "./bip38";
import { performBIP39Configuration } from "./bip39";

export async function forger(options) {
    if (!options.interactive) {
        if (options.forgerBip38) {
            return performBIP38Configuration(options);
        }

        if (options.forgerBip39) {
            return performBIP39Configuration(options);
        }
    }

    const response = await prompts([
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

    if (response.method === "bip38") {
        return performBIP38Configuration(options);
    }

    if (response.method === "bip39") {
        return performBIP39Configuration(options);
    }
}
