"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const command_1 = require("../command");
class PathsCommand extends command_1.BaseCommand {
    async run() {
        const { paths } = await this.parseWithNetwork(PathsCommand);
        utils_1.renderTable(["Type", "Path"], (table) => {
            for (const [type, path] of Object.entries(paths)) {
                // @ts-ignore
                table.push([type, path]);
            }
        });
    }
}
exports.PathsCommand = PathsCommand;
PathsCommand.description = "Get all of the environment paths";
PathsCommand.examples = [
    `List all environment paths
$ ark env:paths
`,
];
PathsCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=paths.js.map