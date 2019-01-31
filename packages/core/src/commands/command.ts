import Command, { flags } from "@oclif/command";
import envPaths from "env-paths";
import Listr from "listr";
import { resolve } from "path";

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
            options: ["mainnet", "devnet", "testnet"],
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
        preset: flags.string({
            description: "the configuration preset to be used",
            options: ["forger", "full", "relay-api", "relay-forger", "relay-minimal", "relay-rpc", "relay-webhooks"],
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

    protected async buildApplication(app, flags: Record<string, any>) {
        const modifiers: any = { skipPlugins: flags.skipPlugins };

        if (flags.preset) {
            modifiers.preset = resolve(__dirname, `../presets/${flags.preset}`);
        }

        await app.setUp(flags.parent._version, flags, {
            ...modifiers,
            ...flags,
        });

        return app;
    }

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
            console.log(error);
        }
    }

    protected getPaths(token: string, network: string): envPaths.Paths {
        const paths: envPaths.Paths = envPaths(token, { suffix: "core" });

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${network}`;
        }

        return paths;
    }
}
