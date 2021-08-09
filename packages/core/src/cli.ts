import { ApplicationFactory, Commands, Container, Contracts, InputParser, Plugins } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import envPaths from "env-paths";
import { readdirSync, readJSONSync } from "fs-extra";
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

            process.exit(0);
        }

        commandInstance.register(this.argv);

        await commandInstance.run();
    }

    private parseNetworkAndToken(flags: any) {
        const tempFlags = {
            token: "ark",
            ...flags,
        };

        if (tempFlags.token && tempFlags.network) {
            return tempFlags;
        }

        try {
            const config = readJSONSync(join(process.env.CORE_PATH_CONFIG!, "config.json"));

            /* istanbul ignore else */
            if (config.token && config.network) {
                return {
                    token: config.token,
                    network: config.network,
                };
            }
        } catch {}

        try {
            const isValidNetwork = (network: string) => {
                return Object.keys(Networks).includes(network);
            };

            const path = envPaths(tempFlags.token, {
                suffix: "core",
            }).config;

            const folders: string[] = readdirSync(path).filter((folder) => isValidNetwork(folder));

            if (folders.length === 1) {
                tempFlags.network = folders[0];
            }
        } catch {}

        return tempFlags;
    }

    /**
     * @private
     * @returns {Contracts.CommandList}
     * @memberof CommandLineInterface
     */
    private async discoverCommands(dirname: string, flags: any): Promise<Contracts.CommandList> {
        const discoverer = this.app.resolve(Commands.DiscoverCommands);
        const commands: Contracts.CommandList = discoverer.within(resolve(dirname, "./commands"));

        const tempFlags = this.parseNetworkAndToken(flags);

        if (process.env.CORE_PLUGINS_PATH || (tempFlags.token && tempFlags.network)) {
            const pluginDiscoverer = this.app.resolve(Commands.DiscoverPlugins);

            const path =
                process.env.CORE_PLUGINS_PATH ||
                join(envPaths(tempFlags.token, { suffix: "core" }).data, tempFlags.network, "plugins");

            const pluginPaths = (await pluginDiscoverer.discover(path)).map((plugin) => plugin.path);

            const commandsFromPlugins = discoverer.from(pluginPaths);

            for (const [key, value] of Object.entries(commandsFromPlugins)) {
                commands[key] = value;
            }
        }

        this.app.bind(Container.Identifiers.Commands).toConstantValue(commands);
        return commands;
    }
}
