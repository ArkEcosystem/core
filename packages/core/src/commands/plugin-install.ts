import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import { File, Git, NPM, Source } from "../source-providers";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "plugin:install";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Installs a package, and any packages that it depends on.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const pkg: string = this.getArgument("package");

        try {
            await this.install(pkg);
        } catch (error) {
            throw new Error(error.message);
        }

        throw new Error(`The given package [${pkg}] is neither a git nor a npm package.`);
    }

    /**
     * @private
     * @param {string} pkg
     * @returns {Promise<void>}
     * @memberof Command
     */
    private async install(pkg: string): Promise<void> {
        for (const Instance of [File, Git, NPM]) {
            const source: Source = new Instance({
                data: this.app.getCorePath("data"),
                temp: this.app.getCorePath("temp"),
            });

            if (await source.exists(pkg)) {
                return source.install(pkg);
            }
        }
    }
}
