import { lstatSync, readdirSync } from "fs-extra";

import { Application, CommandList } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Command } from "./command";

/**
 * @export
 * @class DiscoverCommands
 */
@injectable()
export class DiscoverCommands {
    /**
     * @private
     * @type {Application}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @param {Context} context
     * @param {string} path
     * @returns {CommandList[]}
     * @memberof DiscoverCommands
     */
    public within(path: string): CommandList {
        const commandFiles: string[] = readdirSync(path)
            .map((item: string) => `${path}/${item}`)
            .filter((item: string) => lstatSync(item).isFile())
            .filter((item: string) => item.endsWith(".js"));

        const commands: CommandList = {};

        for (const file of commandFiles) {
            const commandInstance: Command = this.app.resolve(require(file).Command);

            if (!commandInstance.isHidden) {
                commands[commandInstance.signature] = commandInstance;
            }
        }

        return commands;
    }

    /**
     * @param {Context} context
     * @param {string[]} plugins
     * @returns {CommandList[]}
     * @memberof DiscoverCommands
     */
    public from(plugins: string[]): CommandList[] {
        const commands: CommandList[] = [];

        if (!Array.isArray(plugins)) {
            return commands;
        }

        for (const plugin of plugins) {
            for (const CMD of require(plugin).Commands) {
                const commandInstance: Command = this.app.resolve(CMD);

                if (!commandInstance.isHidden) {
                    commands[commandInstance.signature] = commandInstance;
                }
            }
        }

        return commands;
    }
}
