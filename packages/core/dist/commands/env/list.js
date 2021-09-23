"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const envfile_1 = __importDefault(require("envfile"));
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../../utils");
const command_1 = require("../command");
class ListCommand extends command_1.BaseCommand {
    async run() {
        const { paths } = await this.parseWithNetwork(ListCommand);
        const envFile = `${paths.config}/.env`;
        if (!fs_extra_1.existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }
        utils_1.renderTable(["Key", "Value"], (table) => {
            const env = envfile_1.default.parseFileSync(envFile);
            for (const [key, value] of Object.entries(env)) {
                // @ts-ignore
                table.push([key, value]);
            }
        });
    }
}
exports.ListCommand = ListCommand;
ListCommand.description = "List all environment variables";
ListCommand.examples = [
    `List all environment variables
$ ark env:list
`,
];
ListCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=list.js.map