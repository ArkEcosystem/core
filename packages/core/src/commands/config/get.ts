import Command from "../command";

export class ConfigGet extends Command {
    public static description = "Get a value from the configuration";

    public static examples = [
        `Get the log level
$ ark config:get ARK_LOG_LEVEL
`,
    ];

    public static args = [{ name: "key" }];

    public async run() {
        const { args } = this.parse(ConfigGet);
    }
}
