import clear from "clear";
import Tail from "nodejs-tail";
import readLastLines from "read-last-lines";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";

export abstract class AbstractLogCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.abortMissingProcess(processName);

        const { pm2_env } = processManager.describe(processName);

        const file = flags.error ? pm2_env.pm_err_log_path : pm2_env.pm_out_log_path;

        clear();

        this.log(
            `Tailing last ${flags.lines} lines for [${processName}] process (change the value with --lines option)`,
        );

        this.log((await readLastLines.read(file, flags.lines)).trim());

        const log = new Tail(file);

        log.on("line", this.log);

        log.watch();
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
