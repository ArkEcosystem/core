import prompts from "prompts";
import { ConfigureBIP38 } from "./bip38";
import { ConfigureBIP39 } from "./bip39";

import { AbstractCommand } from "../../command";

export class ConfigureForger extends AbstractCommand {
    public async forger(options) {
        if (this.isInterface()) {
            if (options.forgerBip38) {
                return new ConfigureBIP38(this.options).configure();
            }

            if (options.forgerBip39) {
                return new ConfigureBIP39(this.options).configure();
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
            return new ConfigureBIP38(this.options).configure();
        }

        if (response.method === "bip39") {
            return new ConfigureBIP39(this.options).configure();
        }
    }
}
