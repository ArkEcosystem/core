import * as Cli from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";
import { resolve } from "path";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "process.start";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
            args: {
                type: "string",
            },
        },
        required: ["name", "args"],
    };

    public async execute(params: any): Promise<any> {
        return await this.startProcess(params.name, params.args);
    }

    private async startProcess(name: string, args: string): Promise<any> {
        const commands = this.discoverCommands();

        const command: Cli.Commands.Command = commands[`${name}:start`];

        if (!command) {
            throw new Error(`Command ${name}:start does not exists.`);
        }

        const splitArgs = args.replace(/\s+/g, " ").split(" ");

        const argv = [`${name}:start`, ...splitArgs];

        command.register(argv);

        await command.run();

        return {};
    }

    private discoverCommands(): Cli.Contracts.CommandList {
        const cli = this.app.get<Cli.Application>(Identifiers.CLI);

        const discoverer = cli.resolve(Cli.Commands.DiscoverCommands);
        const commands = discoverer.within(resolve("./dist/commands"));

        const startCommands = {};

        for (const command of Object.keys(commands)) {
            if (command.includes(":start")) {
                startCommands[command] = commands[command];
            }
        }

        return startCommands;
    }
}
