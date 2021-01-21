import { Commands, Container } from "@arkecosystem/core-cli";
import Joi from "joi";
import ngrok from "ngrok";

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
    public signature: string = "relay:share";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Share the Relay via ngrok.";

    /**
     * Indicates whether the command requires a network to be present.
     *
     * @type {boolean}
     * @memberof Command
     */
    public requiresNetwork: boolean = false;

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("proto", "Choose one of the available protocols (http|tcp|tls).", Joi.string().default("http"))
            .setFlag("addr", "Port or network address.", Joi.string().default(4003))
            .setFlag("auth", "HTTP basic authentication for tunnel.", Joi.string())
            .setFlag("subdomain", "Reserved tunnel name https://core.ngrok.io.", Joi.string())
            .setFlag("authtoken", "Your authtoken from ngrok.com.", Joi.string())
            .setFlag("region", "Choose one of the ngrok regions (us|eu|au|ap).", Joi.string().default("eu"));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const url: string = await ngrok.connect({
            proto: this.getFlag("proto"),
            addr: this.getFlag("addr"),
            auth: this.getFlag("auth"),
            subdomain: this.getFlag("subdomain"),
            authtoken: this.getFlag("authtoken"),
            region: this.getFlag("region"),
        });

        this.components.info(`Public access to your API: ${url}`);
    }
}
