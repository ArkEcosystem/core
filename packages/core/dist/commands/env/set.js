"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const command_1 = require("../command");
class SetCommand extends command_1.BaseCommand {
    async run() {
        const { args, paths } = await this.parseWithNetwork(SetCommand);
        utils_1.updateEnvironmentVariables(`${paths.config}/.env`, { [args.key]: args.value });
    }
}
exports.SetCommand = SetCommand;
SetCommand.description = "Set the value of an environment variable";
SetCommand.examples = [
    `Set the log level
$ ark env:set CORE_LOG_LEVEL info
`,
];
SetCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
SetCommand.args = [
    { name: "key", required: true, hidden: false },
    { name: "value", required: true, hidden: false },
];
//# sourceMappingURL=set.js.map