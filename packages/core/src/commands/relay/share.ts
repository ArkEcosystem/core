import Command, { flags } from "@oclif/command";
import ngrok from "ngrok";

import { CommandFlags } from "../../types";

export class ShareCommand extends Command {
    public static description = "Share the instance via ngrok";

    public static flags: CommandFlags = {
        proto: flags.string({
            description: "http|tcp|tls",
            default: "http",
        }),
        addr: flags.integer({
            description: "port or network address",
            default: 4003,
        }),
        auth: flags.string({
            description: "http basic authentication for tunnel",
        }),
        subdomain: flags.string({
            description: "reserved tunnel name https://core.ngrok.io",
        }),
        authtoken: flags.string({
            description: "your authtoken from ngrok.com",
        }),
        region: flags.string({
            description: "one of ngrok regions (us, eu, au, ap)",
            default: "eu",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ShareCommand);

        const url: string = await ngrok.connect(flags);

        this.log(`Public access to your API: ${url}`);
    }
}
