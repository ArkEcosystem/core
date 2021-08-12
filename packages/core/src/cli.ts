import {
    ApplicationFactory,
    Commands,
    Container,
    Contracts,
    InputParser,
    Plugins,
    Services,
} from "@arkecosystem/core-cli";
import { join, resolve } from "path";
import { PackageJson } from "type-fest";

/**
 * @export
 * @class CommandLineInterface
 */
@Container.injectable()
export class CommandLineInterface {
    /**
     * @private
     * @type {Contracts.Application}
     * @memberof CommandLineInterface
     */
    private app!: Contracts.Application;

    /**
     * @param {string[]} argv
     * @memberof CommandLineInterface
     */
    public constructor(private readonly argv: string[]) {}

    /**
     * @remarks
     * There are 3 steps to how the CLI is bootstrapped with a single piece of duplication.
     *
     * 1. We load the package.json file into memory so that the updater can do its job.
     * 2. We parse the arguments to figure out what command was supposed to be executed.
     * 3. We parse and validate all arguments if we found a matching command.
     *
     * We parse arguments twice because because before we find a matching command we do not
     * care about their validity and we also don't know what the input definition looks like.
     *
     * @returns {Promise<void>}
     * @memberof CommandLineInterface
     */
    public async execute(dirname = __dirname): Promise<void> {
        // Load the package information. Only needed for updates and installations.
        const pkg: PackageJson = require("../package.json");

        // Create the application we will work with
        this.app = ApplicationFactory.make(new Container.Container(), pkg);

        // Check for updates
        this.app.get<Contracts.Updater>(Container.Identifiers.Updater).check();

        // Parse arguments and flags
        const { args, flags } = InputParser.parseArgv(this.argv);

        // Discover commands and commands from plugins
        const commands: Contracts.CommandList = await this.discoverCommands(dirname, flags);

        // Figure out what command we should run and offer help if necessary
        let commandSignature: string | undefined = args[0];

        if (!commandSignature) {
            await commands.help.execute();

            process.exitCode = 2;
            return;
        }

        let commandInstance: Commands.Command = commands[commandSignature];

        if (!commandInstance) {
            commandSignature = await this.app.resolve(Plugins.SuggestCommand).execute({
                signature: commandSignature,
                signatures: Object.keys(commands),
                bin: Object.keys(pkg.bin!)[0],
            });

            if (commandSignature) {
                commandInstance = commands[commandSignature];
            }
        }

        if (!commandInstance) {
            await commands.help.execute();

            process.exitCode = 2;
            return;
        }

        if (commandInstance && flags.help) {
            commandInstance.showHelp();

            return;
        }

        commandInstance.register(this.argv);

        await commandInstance.run();
    }

    private async detectNetworkAndToken(flags: any): Promise<{ token: string; network?: string }> {
        const tempFlags = {
            token: "ark",
            ...flags,
        };

        if (tempFlags.token && tempFlags.network) {
            return tempFlags;
        }

        const config = await this.app.resolve(Commands.DiscoverConfig).discover(tempFlags.token);
        if (config) {
            return {
                token: config.token,
                network: config.network,
            };
        }

        try {
            tempFlags.network = await this.app.resolve(Commands.DiscoverNetwork).discover(tempFlags.token);
        } catch {}

        return tempFlags;
    }

    private async discoverCommands(dirname: string, flags: any): Promise<Contracts.CommandList> {
        const commandsDiscoverer = this.app.resolve(Commands.DiscoverCommands);
        const commands: Contracts.CommandList = commandsDiscoverer.within(resolve(dirname, "./commands"));

        const pluginsDiscoverer = this.app.resolve(Commands.DiscoverPlugins);

        const tempFlags = await this.detectNetworkAndToken(flags);
        const path = join(
            this.app
                .get<Services.Environment>(Container.Identifiers.Environment)
                .getPaths(tempFlags.token, tempFlags.network!).data,
            "plugins",
        );
        const pluginPaths = (await pluginsDiscoverer.discover(path)).map((plugin) => plugin.path);

        const commandsFromPlugins = commandsDiscoverer.from(pluginPaths);

        for (const [key, value] of Object.entries(commandsFromPlugins)) {
            commands[key] = value;
        }

        this.app.bind(Container.Identifiers.Commands).toConstantValue(commands);
        return commands;
    }
}
