import { flags } from "@oclif/command";
import Command from "../command";

export class ConfigSet extends Command {
    public static description = "Set a value in the configuration";

    public static examples = [`$ ark config:set`];

    public static flags = {
        force: flags.string({ char: "f", description: "force the setting to be set" }),
    };

    public static args = [{ name: "key" }, { name: "value" }];

    public async run() {
        const { args, flags } = this.parse(ConfigSet);
    }
}
