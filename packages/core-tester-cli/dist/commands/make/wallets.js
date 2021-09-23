"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const bip39_1 = require("bip39");
const fs_1 = require("fs");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class WalletCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = await this.make(WalletCommand);
        const wallets = {};
        for (let i = 0; i < flags.quantity; i++) {
            const passphrase = bip39_1.generateMnemonic();
            const keys = crypto_1.Identities.Keys.fromPassphrase(passphrase);
            const address = crypto_1.Identities.Address.fromPublicKey(keys.publicKey);
            wallets[address] = { address, keys, passphrase };
        }
        if (flags.copy) {
            utils_1.copyToClipboard(JSON.stringify(wallets));
        }
        if (flags.write) {
            fs_1.writeFileSync("./wallets.json", JSON.stringify(wallets));
        }
        return wallets;
    }
}
exports.WalletCommand = WalletCommand;
WalletCommand.description = "create new wallets";
WalletCommand.flags = {
    ...command_2.BaseCommand.flagsConfig,
    quantity: command_1.flags.integer({
        description: "number of wallets to generate",
    }),
    copy: command_1.flags.boolean({
        description: "write the wallets to the clipboard",
    }),
    write: command_1.flags.boolean({
        description: "write the wallets to the disk",
    }),
};
//# sourceMappingURL=wallets.js.map