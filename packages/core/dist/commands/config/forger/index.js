"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const prompts_1 = __importDefault(require("prompts"));
const command_2 = require("../../command");
const bip38_1 = require("./bip38");
const bip39_1 = require("./bip39");
class ForgerCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(ForgerCommand);
        delete flags.suffix;
        if (flags.method === "bip38") {
            return bip38_1.BIP38Command.run(this.formatFlags(flags));
        }
        if (flags.method === "bip39") {
            return bip39_1.BIP39Command.run(this.formatFlags(flags));
        }
        // Interactive CLI
        let response = await prompts_1.default([
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
        if (!response.method) {
            this.abortWithInvalidInput();
        }
        response = { ...flags, ...response };
        if (response.method === "bip38") {
            return bip38_1.BIP38Command.run(this.formatFlags(response));
        }
        if (response.method === "bip39") {
            return bip39_1.BIP39Command.run(this.formatFlags(response));
        }
    }
    formatFlags(flags) {
        delete flags.method;
        return this.flagsToStrings(flags).split(" ");
    }
}
exports.ForgerCommand = ForgerCommand;
ForgerCommand.description = "Configure the forging delegate";
ForgerCommand.examples = [
    `Configure a delegate using an encrypted BIP38
$ ark config:forger --method=bip38
`,
    `Configure a delegate using a BIP39 passphrase
$ ark config:forger --method=bip39
`,
];
ForgerCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsForger,
    method: command_1.flags.string({
        description: "the configuration method to use (bip38 or bip39)",
    }),
};
//# sourceMappingURL=index.js.map