"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class DeserializeCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(DeserializeCommand);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        let output;
        if (flags.type === "transaction") {
            output = crypto_1.Transactions.TransactionFactory.fromHex(flags.data).data;
        }
        else {
            const block = crypto_1.Blocks.BlockFactory.fromHex(flags.data);
            output = { data: block.data, transactions: block.transactions.map(tx => tx.data) };
        }
        return utils_1.handleOutput(flags, JSON.stringify(output, undefined, 4));
    }
}
exports.DeserializeCommand = DeserializeCommand;
DeserializeCommand.description = "Deserialize the given HEX";
DeserializeCommand.flags = {
    ...command_2.BaseCommand.flagsDebug,
    data: command_1.flags.string({
        description: "the HEX blob to deserialize",
        required: true,
        default: "transaction",
    }),
    type: command_1.flags.string({
        description: "transaction or block",
        required: true,
    }),
};
//# sourceMappingURL=deserialize.js.map