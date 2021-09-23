"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const envfile_1 = __importDefault(require("envfile"));
const fs_extra_1 = require("fs-extra");
const command_1 = require("../command");
class GetCommand extends command_1.BaseCommand {
    async run() {
        const { args, paths } = await this.parseWithNetwork(GetCommand);
        const envFile = `${paths.config}/.env`;
        if (!fs_extra_1.existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }
        const env = envfile_1.default.parseFileSync(envFile);
        if (!env[args.key]) {
            this.error(`The "${args.key}" doesn't exist.`);
        }
        console.log(env[args.key]);
    }
}
exports.GetCommand = GetCommand;
GetCommand.description = "Get the value of an environment variable";
GetCommand.examples = [
    `Get the log level
$ ark env:get CORE_LOG_LEVEL
`,
];
GetCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
GetCommand.args = [
    { name: "key", required: true, hidden: false },
];
//# sourceMappingURL=get.js.map