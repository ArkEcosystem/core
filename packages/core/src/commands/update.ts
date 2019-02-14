import { checkForUpdates, getUpdateChannel } from "../helpers/update";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the core installation";

    public async run(): Promise<void> {
        await checkForUpdates(this);
    }
}
