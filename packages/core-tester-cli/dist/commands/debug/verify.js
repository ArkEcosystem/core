"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class VerifyCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(VerifyCommand);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        let output = false;
        if (flags.type === "transaction") {
            output = crypto_1.Transactions.TransactionFactory.fromHex(flags.data).verified;
        }
        else {
            output = crypto_1.Blocks.BlockFactory.fromData(crypto_1.Blocks.Block.deserialize(flags.data)).verification.verified;
        }
        return utils_1.handleOutput(flags, output);
    }
}
exports.VerifyCommand = VerifyCommand;
VerifyCommand.description = "Verify the given HEX";
VerifyCommand.flags = {
    ...command_2.BaseCommand.flagsDebug,
    data: command_1.flags.string({
        description: "the HEX blob to deserialize and verify",
        required: true,
    }),
    type: command_1.flags.string({
        description: "transaction or block",
        required: true,
    }),
};
//# sourceMappingURL=verify.js.map