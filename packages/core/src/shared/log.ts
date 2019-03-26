import clear from "clear";
import cli from "cli-ux";
import nsfw from "nsfw";
import readLastLines from "read-last-lines";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";

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

        this.log(
            `Tailing last ${flags.lines} lines for [${processName}] process (change the value with --lines option)`,
        );

        this.log(await readLastLines.read(file, flags.lines));

        const watcher = await nsfw(
            file,
            async (events: FileEvent[]) => {
                for (const event of events) {
                    if (event.action === nsfw.actions.MODIFIED) {
                        clear(); // TODO: this flushes the terminal at the moment which looks a bit awkward

                        this.log(await readLastLines.read(`${event.directory}/${event.file}`, flags.line));
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
}
