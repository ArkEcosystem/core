import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import argon2 from "argon2";
import crypto from "crypto";
import { readJSONSync, writeJSONSync } from "fs-extra";
import Joi from "joi";

interface Options {
    host: string;
    port: number;

    authenticationToken?: string;
    username?: string;
    password?: string;
    whitelist?: string;
}

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * @private
     * @type {Environment}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.Environment)
    private readonly environment!: Services.Environment;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "config:manager";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Update the Manager configuration.";

    private readonly requiredFlags: string[] = ["host", "port"];

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)))
            .setFlag("host", "The host address of the manager.", Joi.string())
            .setFlag("port", "The port of the manager.", Joi.number())
            .setFlag("authenticationToken", "Secret token for token authentication.", Joi.string())
            .setFlag("username", "Basic authentication username.", Joi.string())
            .setFlag("password", "Basic authentication password.", Joi.string())
            .setFlag("whitelist", "Comma separated IP whitelist .", Joi.string());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.requiredFlags.every((flag: string) => this.getFlag(flag))) {
            this.updateEnvironmentVariables(this.getFlags() as Options);
            await this.updateAppJson(this.getFlags() as Options);

            return;
        }

        const response: any = await this.components.prompt([
            {
                type: "text",
                name: "host",
                message: "What host do you want to use?",
                initial: "0.0.0.0",
            },
            {
                type: "number",
                name: "port",
                message: "What port do you want to use?",
                initial: 4005,
                min: 1,
                max: 65535,
            },
            {
                type: "text",
                name: "whitelist",
                message: "Which IPs can be whitelisted? Separate values with comma. Enter * for all.",
            },
            {
                type: "select",
                name: "authenticationType",
                message: "Which authentication system do you want to use?",
                choices: [
                    { title: "None", value: "none" },
                    { title: "Token", value: "token" },
                    { title: "Basic", value: "basic" },
                ],
                initial: 2,
            },
            {
                type: (prev, values) => {
                    return values.authenticationType === "token" ? "password" : null;
                },
                name: "authenticationToken",
                message: "Enter authentication token:",
            },
            {
                type: (prev, values) => {
                    return values.authenticationType === "basic" ? "text" : null;
                },
                name: "username",
                message: "Enter username:",
            },
            {
                type: (prev, values) => {
                    return values.authenticationType === "basic" ? "password" : null;
                },
                name: "password",
                message: "Enter password:",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.confirm) {
            throw new Error("You'll need to confirm the input to continue.");
        }

        this.updateEnvironmentVariables(response);
        await this.updateAppJson(response);
    }

    private updateEnvironmentVariables(options: Options): void {
        const variables: Contracts.AnyObject = {
            CORE_MANAGER_HOST: options.host,
            CORE_MANAGER_PORT: options.port,
        };

        const envFile = this.app.getCorePath("config", ".env");
        this.environment.updateVariables(envFile, variables);
    }

    private async updateAppJson(options: Options): Promise<void> {
        const appJsonFile = this.app.getCorePath("config", "app.json");
        const appJson = readJSONSync(appJsonFile);

        appJson.manager = await this.generateManagerSection(options);

        writeJSONSync(appJsonFile, appJson, { spaces: 4 });
    }

    private async generateManagerSection(options: Options): Promise<any> {
        const result: any = {
            plugins: [
                {
                    package: "@arkecosystem/core-logger-pino",
                },
                {
                    package: "@arkecosystem/core-database",
                },
                {
                    package: "@arkecosystem/core-snapshots",
                },
                {
                    package: "@arkecosystem/core-manager",
                },
            ],
        };

        const packageOptions: any = {
            plugins: {},
        };

        if (options.username && options.password) {
            const secret = this.generateSecret();

            packageOptions.plugins.basicAuthentication = {
                enabled: true,
                secret,
                users: [
                    {
                        username: options.username,
                        password: await argon2.hash(options.password, {
                            type: argon2.argon2id,
                            secret: Buffer.from(secret),
                        }),
                    },
                ],
            };
        } else if (options.authenticationToken) {
            packageOptions.plugins.tokenAuthentication = {
                enabled: true,
                token: options.authenticationToken,
            };
        }

        if (options.whitelist) {
            packageOptions.plugins.whitelist = options.whitelist.replace(" ", "").split(",");
        }

        if (Object.keys(packageOptions.plugins).length) {
            result.plugins.find((plugin) => plugin.package === "@arkecosystem/core-manager").options = packageOptions;
        }

        return result;
    }

    private generateSecret(): string {
        const buf = Buffer.alloc(64);
        return crypto.randomFillSync(buf).toString("hex");
    }
}
