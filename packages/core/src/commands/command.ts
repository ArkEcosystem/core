import { networks } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import envPaths from "env-paths";
import { readdirSync } from "fs";
import Listr from "listr";
import { join } from "path";
import pm2 from "pm2";
import prompts from "prompts";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

export abstract class BaseCommand extends Command {
    public static flagsNetwork: Record<string, object> = {
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

    protected buildPeerOptions(flags: Record<string, any>) {
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

    protected flagsToStrings(flags: Record<string, any>, ignoreKeys: string[] = []): string {
        const mappedFlags = [];

        for (const [key, value] of Object.entries(flags)) {
            if (!ignoreKeys.includes(key)) {
                mappedFlags.push(value === true ? `--${key}` : `--${key}=${value}`);
            }
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
            this.error(error.message);
        }
    }

    protected getEnvPaths(flags: Record<string, any>): envPaths.Paths {
        return envPaths(flags.token, { suffix: "core" });
    }

    protected async getPaths(flags: Record<string, any>): Promise<envPaths.Paths> {
        if (!flags.network) {
            await this.getNetwork(flags);
        }

        const paths: envPaths.Paths = this.getEnvPaths(flags);

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${flags.network}`;
        }

        return paths;
    }

    protected async getNetwork(flags: Record<string, any>): Promise<void> {
        if (process.env.CORE_PATH_CONFIG) {
            const network: string = process.env.CORE_PATH_CONFIG.split("/").pop();

            if (this.isValidNetwork(network)) {
                flags.network = network;
                return;
            }
        }

        const { config } = this.getEnvPaths(flags);

        try {
            const folders: string[] = readdirSync(config);

            if (!folders || folders.length === 0) {
                this.error(
                    'We were unable to detect any configuration. Please run "ark config:publish" and try again.',
                );
            }

            if (folders.length === 1) {
                flags.network = folders[0];
            } else {
                const response = await prompts([
                    {
                        type: "autocomplete",
                        name: "network",
                        message: "What network do you want to operate on?",
                        choices: folders
                            .filter(folder => this.isValidNetwork(folder))
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
        } catch (error) {
            this.error('We were unable to detect any configuration. Please run "ark config:publish" and try again.');
        }
    }

    protected abortWithInvalidInput(): void {
        this.error("Please enter valid data and try again!");
    }

    protected createPm2Connection(callback, noDaemonMode: boolean = false): void {
        pm2.connect(noDaemonMode, error => {
            if (error) {
                this.error(error.message);
            }

            callback();
        });
    }

    protected async buildBIP38(flags: Record<string, any>): Promise<Record<string, string>> {
        // initial values
        let bip38 = flags.bip38 || process.env.CORE_FORGER_BIP38;
        let password = flags.password || process.env.CORE_FORGER_PASSWORD;

        if (bip38 && password) {
            return { bip38, password };
        }

        // config
        const { config } = await this.getPaths(flags);
        const delegates = require(join(config, "delegates.json"));

        if (!bip38 && delegates.bip38) {
            bip38 = delegates.bip38;
        }

        if (!bip38 && !delegates.secrets.length) {
            this.error("We were unable to detect a BIP38 or BIP39 passphrase.");
        }

        // fallback
        if (bip38 && !password) {
            const response = await prompts([
                {
                    type: "password",
                    name: "password",
                    message: "Please enter your BIP38 password",
                },
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                    initial: true,
                },
            ]);

            if (!response.password) {
                this.error("We've detected that you are using BIP38 but have not provided a valid password.");
            }

            password = response.password;
        }

        return { bip38, password };
    }

    protected isValidNetwork(network: string): boolean {
        return Object.keys(networks).includes(network);
    }
}
