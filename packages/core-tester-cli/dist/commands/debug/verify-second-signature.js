"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class VerifySecondSignatureCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(VerifySecondSignatureCommand);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        const { data } = crypto_1.Transactions.TransactionFactory.fromHex(flags.data);
        return utils_1.handleOutput(flags, crypto_1.Transactions.Verifier.verifySecondSignature(data, flags.publicKey));
    }
}
exports.VerifySecondSignatureCommand = VerifySecondSignatureCommand;
VerifySecondSignatureCommand.description = "Verify a second signature of a transaction";
VerifySecondSignatureCommand.flags = {
    ...command_2.BaseCommand.flagsDebug,
    data: command_1.flags.string({
        description: "the HEX blob to deserialize and verify",
        required: true,
    }),
    publicKey: command_1.flags.string({
        description: "the publicKey of the second signature in HEX",
        required: true,
    }),
};
//# sourceMappingURL=verify-second-signature.js.map