"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class IdentityCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(IdentityCommand);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        let output;
        if (flags.type === "passphrase") {
            const keys = crypto_1.Identities.Keys.fromPassphrase(flags.data);
            output = {
                passphrase: flags.data,
                publicKey: keys.publicKey,
                privateKey: keys.privateKey,
                address: crypto_1.Identities.Address.fromPublicKey(keys.publicKey),
            };
        }
        else if (flags.type === "privateKey") {
            const keys = crypto_1.Identities.Keys.fromPrivateKey(flags.data);
            output = {
                publicKey: keys.publicKey,
                privateKey: keys.privateKey,
                address: crypto_1.Identities.Address.fromPublicKey(keys.publicKey),
            };
        }
        else if (flags.type === "publicKey") {
            output = {
                publicKey: flags.data,
                address: crypto_1.Identities.Address.fromPublicKey(flags.data),
            };
        }
        return utils_1.handleOutput(flags, output);
    }
}
exports.IdentityCommand = IdentityCommand;
IdentityCommand.description = "Get identities from the given input";
IdentityCommand.flags = {
    ...command_2.BaseCommand.flagsDebug,
    data: command_1.flags.string({
        description: "the data to get the identities from",
        required: true,
    }),
    type: command_1.flags.string({
        description: "the input type is either of passphrase, privateKey or publicKey",
        required: true,
    }),
};
//# sourceMappingURL=identity.js.map