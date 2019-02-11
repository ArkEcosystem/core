import Command, { flags } from "@oclif/command";

export abstract class BaseCommand extends Command {
    public static flags = {
        log: flags.string({
            description: "log the data to the console",
        }),
        copy: flags.string({
            description: "copy the data to the clipboard",
        }),
    };
}
