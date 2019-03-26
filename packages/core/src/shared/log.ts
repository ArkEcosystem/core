import clear from "clear";
import cli from "cli-ux";
import nsfw from "nsfw";
import readLastLines from "read-last-lines";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";

interface FileEvent {
    action: number;
    directory: string;
    file: string;
}

export abstract class AbstractLogCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.abortMissingProcess(processName);

        const { pm2_env } = processManager.describe(processName);

        const file = flags.error ? pm2_env.pm_err_log_path : pm2_env.pm_out_log_path;

        await this.logLines(file, processName, flags);

        const watcher = await nsfw(
            file,
            async (events: FileEvent[]) => {
                for (const event of events) {
                    if (event.action === nsfw.actions.MODIFIED) {
                        await this.logLines(`${event.directory}/${event.file}`, processName, flags);
                    }
                }
            },
            {
                debounceMS: 250,
            },
        );

        await watcher.start();
    }

    public abstract getClass();

    public abstract getSuffix(): string;

    private async logLines(file: string, processName: string, flags: CommandFlags): Promise<void> {
        clear();

        this.log(
            `Tailing last ${flags.lines} lines for [${processName}] process (change the value with --lines option)`,
        );

        this.log(await readLastLines.read(file, flags.lines));
    }
}
