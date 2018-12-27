import Command from "../command";

export class ConfigGet extends Command {
    public static description = "Get a value from the configuration";

    public static examples = [`$ ark config:get`];

    public static args = [{ name: "key" }];

    public async run() {
        const { args } = this.parse(ConfigGet);
    }
}
