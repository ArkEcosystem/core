"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const prompts_1 = __importDefault(require("prompts"));
const command_1 = require("../command");
const publish_1 = require("./publish");
class ResetCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(ResetCommand);
        if (flags.network) {
            return this.performReset(flags);
        }
        // Interactive CLI
        const response = await prompts_1.default([
            {
                type: "confirm",
                name: "confirm",
                message: "Are you absolutely sure that you want to reset the configuration?",
            },
        ]);
        if (response.confirm) {
            return this.performReset(flags);
        }
    }
    async performReset(flags) {
        const { config } = await this.getPaths(flags);
        this.addTask("Remove configuration", async () => {
            fs_extra_1.default.removeSync(config);
        });
        await this.runTasks();
        return publish_1.PublishCommand.run(this.flagsToStrings(flags).split(" "));
    }
}
exports.ResetCommand = ResetCommand;
ResetCommand.description = "Reset the configuration";
ResetCommand.examples = [
    `Reset the configuration for the mainnet network
$ ark config:reset --network=mainnet
`,
];
ResetCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=reset.js.map