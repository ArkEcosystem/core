"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class SerializeCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(SerializeCommand);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        let serialized;
        if (flags.type === "transaction") {
            serialized = crypto_1.Transactions.TransactionFactory.fromData(JSON.parse(flags.data)).serialized;
        }
        else {
            // @TODO: call applySchema in @arkecosystem/crypto before serialising
            const block = crypto_1.Blocks.Block.applySchema(JSON.parse(flags.data));
            serialized = crypto_1.Blocks.Block[flags.full ? "serializeWithTransactions" : "serialize"](block);
        }
        return utils_1.handleOutput(flags, serialized.toString("hex"));
    }
}
exports.SerializeCommand = SerializeCommand;
SerializeCommand.description = "Serialize the given JSON";
SerializeCommand.flags = {
    ...command_2.BaseCommand.flagsDebug,
    data: command_1.flags.string({
        description: "the JSON to serialize",
        required: true,
    }),
    type: command_1.flags.string({
        description: "transaction or block",
        required: true,
    }),
    full: command_1.flags.boolean({
        description: "serialize a full block with transactions",
        required: false,
    }),
};
//# sourceMappingURL=serialize.js.map