import { ApplicationFactory, Commands, Container, Contracts, InputParser, Plugins } from "@arkecosystem/core-cli";
import { resolve } from "path";
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
    public async execute(): Promise<void> {
        // Load the package information. Only needed for updates and installations.
        const pkg: PackageJson = require("../package.json");

        // Create the application we will work with
        this.app = ApplicationFactory.make(new Container.Container(), pkg);

        // Check for updates
        this.app.get<Contracts.Updater>(Container.Identifiers.Updater).check();

        // Discover commands and commands from plugins
        const commands: Contracts.CommandList = this.discoverCommands();

        // Figure out what command we should run and offer help if necessary
        const { args, flags } = InputParser.parseArgv(this.argv);

        let commandSignature: string | undefined = args[0];

        if (!commandSignature) {
            await commands.help.execute();

            process.exit(2);
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

            process.exit(2);
        }

        if (commandInstance && flags.help) {
            commandInstance.showHelp();

            process.exit(2);
        }

        commandInstance.register(this.argv);

        await commandInstance.run();
    }

    /**
     * @private
     * @returns {Contracts.CommandList}
     * @memberof CommandLineInterface
     */
    private discoverCommands(): Contracts.CommandList {
        const discoverer = this.app.resolve(Commands.DiscoverCommands);

        const commands: Contracts.CommandList = discoverer.within(resolve(__dirname, "./commands"));
        const commandsFromPlugins = discoverer.from(
            this.app.get<Contracts.Config>(Container.Identifiers.Config).get("plugins"),
        );

        for (const [key, value] of Object.entries(commandsFromPlugins)) {
            commands[key] = value;
        }

        this.app.bind(Container.Identifiers.Commands).toConstantValue(commands);

        return commands;
    }
}
