"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const prompts_1 = require("../../helpers/prompts");
const command_1 = require("../command");
class ClearCommand extends command_1.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(ClearCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        if (flags.force) {
            return this.removeFiles(paths.data);
        }
        try {
            await prompts_1.confirm("Are you sure you want to clear the transaction pool?", async () => {
                this.removeFiles(paths.data);
            });
        }
        catch (err) {
            this.error(err.message);
        }
    }
    removeFiles(dataPath) {
        const files = fs_1.readdirSync(dataPath).filter((file) => file.includes("transaction-pool"));
        for (const file of files) {
            fs_extra_1.removeSync(`${dataPath}/${file}`);
        }
    }
}
exports.ClearCommand = ClearCommand;
ClearCommand.description = "Clear the transaction pool";
ClearCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=clear.js.map