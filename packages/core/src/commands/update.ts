import { list } from "../helpers/pm2";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the core installation";

    public async run(): Promise<void> {
        // const { flags } = this.parse(UpdateCommand);
    }
}
