import { networks } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import envPaths from "env-paths";
import { readdirSync } from "fs";
import Listr from "listr";
import prompts from "prompts";
import { logger } from "../logger";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

export abstract class BaseCommand extends Command {
    public static flagsConfig: Record<string, object> = {
        data: flags.string({
            description: "the directory that contains the core data",
        }),
        config: flags.string({
            description: "the directory that contains the core configuration",
        }),
    };

    public static flagsNetwork: Record<string, object> = {
        ...BaseCommand.flagsConfig,
        token: flags.string({
            description: "the name of the token that should be used",
            default: "ark",
            required: true,
        }),
        network: flags.string({
            description: "the name of the network that should be used",
            options: Object.keys(networks),
        }),
    };

    public static flagsNetworkRequired: Record<string, object> = {
        token: flags.string({
            description: "the name of the token that should be used",
            default: "ark",
            required: true,
        }),
        network: flags.string({
            description: "the name of the network that should be used",
            options: Object.keys(networks),
            required: true,
        }),
    };

    public static flagsBehaviour: Record<string, object> = {
        networkStart: flags.boolean({
            description: "indicate that this is the first start of seeds",
        }),
        disableDiscovery: flags.boolean({
            description: "permanently disable any peer discovery",
        }),
        skipDiscovery: flags.boolean({
            description: "skip the initial peer discovery",
        }),
        ignoreMinimumNetworkReach: flags.boolean({
            description: "ignore the minimum network reach on start",
        }),
        launchMode: flags.string({
            description: "the mode the relay will be launched in (seed only at the moment)",
        }),
    };

    public static flagsForger: Record<string, object> = {
        bip38: flags.string({
            description: "the encrypted bip38",
            dependsOn: ["password"],
        }),
        bip39: flags.string({
            description: "the plain text bip39 passphrase",
            exclusive: ["bip38", "password"],
        }),
        password: flags.string({
            description: "the password for the encrypted bip38",
            dependsOn: ["bip38"],
        }),
    };

    protected tasks: Array<{ title: string; task: any }> = [];

    protected buildPeerOptions(flags) {
        const config = {
            networkStart: flags.networkStart,
            disableDiscovery: flags.disableDiscovery,
            skipDiscovery: flags.skipDiscovery,
            ignoreMinimumNetworkReach: flags.ignoreMinimumNetworkReach,
        };

        if (flags.launchMode === "seed") {
            config.skipDiscovery = true;
            config.ignoreMinimumNetworkReach = true;
        }

        return config;
    }

    protected async buildApplication(app, flags: Record<string, any>, config: Record<string, any>) {
        await app.setUp(version, flags, {
            ...{ skipPlugins: flags.skipPlugins },
            ...config,
        });

        return app;
    }

    protected flagsToStrings(flags: Record<string, any>): string {
        const mappedFlags = [];

        for (const [key, value] of Object.entries(flags)) {
            mappedFlags.push(value === true ? `--${key}` : `--${key}=${value}`);
        }

        return mappedFlags.join(" ");
    }

    protected addTask(title: string, task: any): this {
        this.tasks.push({ title, task });

        return this;
    }

    protected async runTasks(): Promise<void> {
        try {
            const tasks = new Listr(this.tasks);
            await tasks.run();
        } catch (error) {
            logger.error(error);
        }
    }

    protected getEnvPaths(flags): envPaths.Paths {
        return envPaths(flags.token, { suffix: "core" });
    }

    protected async getPaths(flags): Promise<envPaths.Paths> {
        if (!flags.network) {
            await this.getNetwork(flags);
        }

        const paths: envPaths.Paths = this.getEnvPaths(flags);

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${flags.network}`;
        }

        return paths;
    }

    protected async getNetwork(flags): Promise<void> {
        const { config } = this.getEnvPaths(flags);

        const folders = readdirSync(config);

        if (folders.length === 1) {
            flags.network = folders[0];
        } else {
            const response = await prompts([
                {
                    type: "autocomplete",
                    name: "network",
                    message: "What network do you want to operate on?",
                    choices: folders
                        .filter(folder => Object.keys(networks).includes(folder))
                        .map(folder => ({ title: folder, value: folder })),
                },
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                    initial: true,
                },
            ]);

            if (!response.network) {
                this.abortWithInvalidInput();
            }

            if (response.confirm) {
                flags.network = response.network;
            }
        }
    }

    protected abortWithInvalidInput(): void {
        logger.error("Please enter valid data and try again!");
        process.exit();
    }
}
