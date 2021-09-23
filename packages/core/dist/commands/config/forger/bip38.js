"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const bip39_1 = require("bip39");
const fs_extra_1 = __importDefault(require("fs-extra"));
const prompts_1 = __importDefault(require("prompts"));
const wif_1 = __importDefault(require("wif"));
const command_2 = require("../../command");
class BIP38Command extends command_2.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(BIP38Command);
        if (flags.bip39 && flags.password) {
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
                type: "password",
                name: "password",
                message: "Please enter your desired BIP38 password",
                validate: value => (typeof value !== "string" ? `The BIP38 password has to be a string.` : true),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);
        if (!response.bip39 || !response.password) {
            this.abortWithInvalidInput();
        }
        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }
    async performConfiguration(flags) {
        const { config } = await this.getPaths(flags);
        const delegatesConfig = `${config}/delegates.json`;
        let decodedWIF;
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
        this.addTask("Prepare crypto", async () => {
            crypto_1.Managers.configManager.setFromPreset(flags.network);
        });
        this.addTask("Loading private key", async () => {
            // @ts-ignore
            decodedWIF = wif_1.default.decode(crypto_1.Identities.WIF.fromPassphrase(flags.bip39));
        });
        this.addTask("Encrypt BIP38", async () => {
            const delegates = require(delegatesConfig);
            delegates.bip38 = crypto_1.Crypto.bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, flags.password);
            delegates.secrets = [];
            fs_extra_1.default.writeFileSync(delegatesConfig, JSON.stringify(delegates, undefined, 2));
        });
        await this.runTasks();
    }
}
exports.BIP38Command = BIP38Command;
BIP38Command.description = "Configure the forging delegate (BIP38)";
BIP38Command.examples = [
    `Configure a delegate using an encrypted BIP38
$ ark config:forger:bip38 --bip39="..." --password="..."
`,
];
BIP38Command.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    bip39: command_1.flags.string({
        description: "the plain text bip39 passphrase",
    }),
    password: command_1.flags.string({
        description: "the password for the encrypted bip38",
    }),
};
//# sourceMappingURL=bip38.js.map