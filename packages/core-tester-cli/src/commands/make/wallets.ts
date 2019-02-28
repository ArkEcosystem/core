import { crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { generateMnemonic } from "bip39";
import { writeFileSync } from "fs";
import { copyToClipboard } from "../../utils";
import { BaseCommand } from "../command";

export class WalletCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsConfig,
        quantity: flags.integer({
            description: "number of wallets to generate",
        }),
        copy: flags.boolean({
            description: "write the wallets to the clipboard",
        }),
        write: flags.boolean({
            description: "write the wallets to the disk",
        }),
    };

    public async run(): Promise<Record<string, any>> {
        const { flags } = await this.make(WalletCommand);

        const wallets = {};
        for (let i = 0; i < flags.quantity; i++) {
            const passphrase = generateMnemonic();
            const keys = crypto.getKeys(passphrase);
            const address = crypto.getAddress(keys.publicKey, this.network.version);

            wallets[address] = { address, keys, passphrase };
        }

        if (flags.copy) {
            copyToClipboard(JSON.stringify(wallets));
        }

        if (flags.write) {
            writeFileSync("./wallets.json", JSON.stringify(wallets));
        }

        return wallets;
    }
}
