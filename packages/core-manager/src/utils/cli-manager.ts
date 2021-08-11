import * as Cli from "@arkecosystem/core-cli";
import { Container } from "@arkecosystem/core-kernel";
import { Identifiers } from "../ioc";
import { dirname, join } from "path";

@Container.injectable()
export class CliManager {
    @Container.inject(Identifiers.CLI)
    private readonly cli!: Cli.Application;

    public async runCommand(name: string, args: string = ""): Promise<void> {
        const commands = this.discoverCommands();

        const command: Cli.Commands.Command = commands[name];

        if (!command) {
            throw new Error(`Command ${name} does not exists.`);
        }

        const splitArgs = args.replace(/\s+/g, " ").split(" ");

        const argv = [name, ...splitArgs];

        command.register(argv);

        await command.run();
    }

    private discoverCommands(): Cli.Contracts.CommandList {
        const discoverer = this.cli.resolve(Cli.Commands.DiscoverCommands);
        return discoverer.within(join(dirname(require.resolve("@arkecosystem/core")), "commands"));
    }
}
