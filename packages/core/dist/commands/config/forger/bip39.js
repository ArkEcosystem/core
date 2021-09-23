"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const bip39_1 = require("bip39");
const fs_extra_1 = __importDefault(require("fs-extra"));
const prompts_1 = __importDefault(require("prompts"));
const command_2 = require("../../command");
class BIP39Command extends command_2.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(BIP39Command);
        if (flags.bip39) {
            return this.performConfiguration(flags);
        }
        // Interactive CLI
        const response = await prompts_1.default([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate passphrase",
                validate: value => !bip39_1.validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);
        if (!response.bip39) {
            this.abortWithInvalidInput();
        }
        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }
    async performConfiguration(flags) {
        const { config } = await this.getPaths(flags);
        const delegatesConfig = `${config}/delegates.json`;
        this.addTask("Prepare configuration", async () => {
            if (!fs_extra_1.default.existsSync(delegatesConfig)) {
                this.error(`Couldn't find the delegates configuration at ${delegatesConfig}.`);
            }
        });
        this.addTask("Validate passphrase", async () => {
            if (!bip39_1.validateMnemonic(flags.bip39)) {
                this.error(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });
        this.addTask("Write BIP39 to configuration", async () => {
            const delegates = require(delegatesConfig);
            delegates.secrets = [flags.bip39];
            delete delegates.bip38;
            fs_extra_1.default.writeFileSync(delegatesConfig, JSON.stringify(delegates, undefined, 2));
        });
        await this.runTasks();
    }
}
exports.BIP39Command = BIP39Command;
BIP39Command.description = "Configure the forging delegate (BIP39)";
BIP39Command.examples = [
    `Configure a delegate using a BIP39 passphrase
$ ark config:forger:bip39 --bip39="..."
`,
];
BIP39Command.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    bip39: command_1.flags.string({
        description: "the plain text bip39 passphrase",
    }),
};
//# sourceMappingURL=bip39.js.map