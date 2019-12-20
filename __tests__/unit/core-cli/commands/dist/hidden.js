"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_cli_1 = require("@arkecosystem/core-cli");
const boxen_1 = __importDefault(require("boxen"));
const kleur_1 = require("kleur");
/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
let Command = class Command extends core_cli_1.Commands.Command {
    constructor() {
        super(...arguments);
        /**
         * The console command signature.
         *
         * @type {string}
         * @memberof Command
         */
        this.signature = "help";
        /**
         * The console command description.
         *
         * @type {string}
         * @memberof Command
         */
        this.description = "Displays detailed information on all commands available via CLI.";
        /**
         * Indicates whether the command requires a network to be present.
         *
         * @type {boolean}
         * @memberof Command
         */
        this.requiresNetwork = false;

        this.isHidden = true;
    }
    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    async execute() {
        const commands = this.app.get(core_cli_1.Container.Identifiers.Commands);
        // figure out the longest signature
        const signatures = Object.keys(commands);
        const longestSignature = signatures.reduce((a, b) => (a.length > b.length ? a : b)).length;
        // create groups
        const signatureGroups = {};
        for (const signature of signatures) {
            const groupName = signature.includes(":") ? signature.split(":")[0] : "default";
            if (!signatureGroups[groupName]) {
                signatureGroups[groupName] = [];
            }
            signatureGroups[groupName].push(signature);
        }
        // turn everything into a human readable format
        const commandsAsString = [];
        for (const [signatureGroup, signatures] of Object.entries(signatureGroups)) {
            commandsAsString.push(kleur_1.cyan().bold(signatureGroup));
            for (const signature of signatures) {
                commandsAsString.push(`  ${signature.padEnd(longestSignature, " ")}        ${commands[signature].description}`);
            }
        }
        console.log(boxen_1.default(this.components.appHeader() +
            `

${kleur_1.blue().bold("Usage")}
  command [arguments] [flags]

${kleur_1.blue().bold("Flags")}
  --help              Display the corresponding help message.
  --quiet             Do not output any message
  --version           Display the application version.
  --no-interaction    Do not ask interactive questions.
  --v|vv|vvv          Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug

${kleur_1.blue().bold("Available Commands")}
${commandsAsString.join("\n")}`, {
            padding: 1,
            borderStyle: "classic" /* Classic */,
        }));
    }
};
Command = __decorate([
    core_cli_1.Container.injectable()
], Command);
exports.Command = Command;
//# sourceMappingURL=help.js.map
