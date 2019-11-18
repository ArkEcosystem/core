import { Container } from "@arkecosystem/core-interfaces";
import { Networks } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import cli from "cli-ux";
import envPaths, { Paths } from "env-paths";
import { existsSync, readdirSync } from "fs";
import Listr from "listr";
import { join, resolve } from "path";
import prompts from "prompts";
import { configManager } from "../helpers/config";
import { confirm } from "../helpers/prompts";
import { processManager } from "../process-manager";
import { CommandFlags, Options } from "../types";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

const validNetworks = Object.keys(Networks).filter(network => network !== "unitnet");

export abstract class BaseCommand extends Command {
    public static flagsNetwork: Record<string, object> = {
        token: flags.string({
            description: "the name of the token that should be used",
        }),
        network: flags.string({
            description: "the name of the network that should be used",
            options: validNetworks,
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
            exclusive: ["bip38"],
        }),
        password: flags.string({
            description: "the password for the encrypted bip38",
        }),
        suffix: flags.string({
            hidden: true,
            default: "forger",
        }),
    };

    public static flagsSnapshot: Record<string, object> = {
        ...BaseCommand.flagsNetwork,
        skipCompression: flags.boolean({
            description: "skip gzip compression",
        }),
        trace: flags.boolean({
            description: "dumps generated queries and settings to console",
        }),
        suffix: flags.string({
            hidden: true,
            default: "snapshot",
        }),
    };

    protected tasks: Array<{ title: string; task: any }> = [];

    protected buildPeerOptions(flags: CommandFlags) {
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

    protected async buildApplication(app: Container.IContainer, flags: CommandFlags, config: Options) {
        process.env.CORE_ENV = flags.env;

        await app.setUp(version, flags, {
            ...{ skipPlugins: flags.skipPlugins },
            ...config,
        });

        return app;
    }

    protected flagsToStrings(flags: CommandFlags, ignoreKeys: string[] = []): string {
        const mappedFlags = [];

        for (const [key, value] of Object.entries(flags)) {
            if (!ignoreKeys.includes(key) && value !== undefined) {
                if (value === true) {
                    mappedFlags.push(`--${key}`);
                } else if (typeof value === "string") {
                    mappedFlags.push(value.includes(" ") ? `--${key}="${value}"` : `--${key}=${value}`);
                } else {
                    mappedFlags.push(`--${key}=${value}`);
                }
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

    protected async getPaths(flags: CommandFlags): Promise<Paths> {
        let paths: Paths = this.getEnvPaths(flags);

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${flags.network}`;
        }

        if (process.env.CORE_PATH_CONFIG) {
            paths = { ...paths, ...{ config: resolve(process.env.CORE_PATH_CONFIG) } };
        }

        return paths;
    }

    protected async parseWithNetwork(command: any): Promise<any> {
        const { args, flags } = this.parse(command);

        if (!flags.token) {
            flags.token = configManager.get("token");
        }

        if (process.env.CORE_PATH_CONFIG && !flags.network) {
            let config: string = process.env.CORE_PATH_CONFIG;

            if (!existsSync(config)) {
                this.error(`The given config "${config}" does not exist.`);
            }

            if (config.endsWith("/")) {
                config = config.slice(0, -1);
            }

            const network: string = config.split("/").pop();

            if (!this.isValidNetwork(network)) {
                this.error(`The given network "${flags.network}" is not valid.`);
            }

            flags.network = network;
        }

        if (!flags.network) {
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
                            type: "select",
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
                this.error(
                    'We were unable to detect any configuration. Please run "ark config:publish" and try again.',
                );
            }
        }

        return { args, flags, paths: await this.getPaths(flags) };
    }

    protected abortWithInvalidInput(): void {
        this.error("Please enter valid data and try again!");
    }

    protected async buildBIP38(flags: CommandFlags): Promise<Record<string, string>> {
        if (flags.bip39) {
            return { bip38: undefined, password: undefined };
        }

        // initial values
        let bip38 = flags.bip38 || process.env.CORE_FORGER_BIP38;
        let password = flags.password || process.env.CORE_FORGER_PASSWORD;

        if (bip38 && password) {
            return { bip38, password };
        }

        // config
        const { config } = await this.getPaths(flags);

        const configDelegates = join(config, "delegates.json");

        if (!existsSync(configDelegates)) {
            this.error(`The ${configDelegates} file does not exist.`);
        }

        const delegates = require(configDelegates);

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
                },
            ]);

            if (!response.password) {
                this.error("We've detected that you are using BIP38 but have not provided a valid password.");
            }

            password = response.password;
        }

        if (bip38 && password) {
            flags.bip38 = bip38;
            flags.password = password;
        }

        return { bip38, password };
    }

    protected getNetworks(): string[] {
        return validNetworks;
    }

    protected isValidNetwork(network: string): boolean {
        return this.getNetworks().includes(network);
    }

    protected getNetworksForPrompt(): any {
        return this.getNetworks().map(network => ({ title: network, value: network }));
    }

    protected async restartRunningProcessPrompt(processName: string, showPrompt: boolean = true) {
        if (processManager.isOnline(processName)) {
            if (showPrompt) {
                await confirm(`Would you like to restart the ${processName} process?`, () => {
                    this.restartProcess(processName);
                });
            } else {
                this.restartProcess(processName);
            }
        }
    }

    protected restartProcess(processName: string): void {
        try {
            cli.action.start(`Restarting ${processName}`);
            processManager.restart(processName);
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }

    protected abortRunningProcess(processName: string) {
        if (processManager.isOnline(processName)) {
            this.error(`The "${processName}" process is already running.`);
        }
    }

    protected abortStoppedProcess(processName: string) {
        if (processManager.isStopped(processName)) {
            this.error(`The "${processName}" process is not running.`);
        }
    }

    protected abortErroredProcess(processName: string) {
        if (processManager.isErrored(processName)) {
            this.error(`The "${processName}" process has errored.`);
        }
    }

    protected abortUnknownProcess(processName: string) {
        if (processManager.isUnknown(processName)) {
            this.error(
                `The "${processName}" process has entered an unknown state. (${processManager.status(processName)})`,
            );
        }
    }

    protected abortMissingProcess(processName: string) {
        if (processManager.missing(processName)) {
            this.error(`The "${processName}" process does not exist.`);
        }
    }

    private getEnvPaths(flags: CommandFlags): Paths {
        return envPaths(flags.token, { suffix: "core" });
    }
}
