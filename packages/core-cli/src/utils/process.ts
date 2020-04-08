import { Utils } from "@arkecosystem/core-kernel";
import { prettyBytes, prettyTime } from "@arkecosystem/utils";
import dayjs from "dayjs";
import Tail from "nodejs-tail";
import readLastLines from "read-last-lines";

import { AbortMissingProcess, AbortStoppedProcess, AbortUnknownProcess } from "../actions";
import { Application } from "../application";
import { Clear, Spinner, Table } from "../components";
import { ProcessDescription } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class Process
 */
@injectable()
export class Process {
    /**
     * @private
     * @type {Application}
     * @memberof ComponentFactory
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {ProcessManager}
     * @memberof Command
     */
    @inject(Identifiers.ProcessManager)
    private readonly processManager!: ProcessManager;

    /**
     * @private
     * @type {string}
     * @memberof Process
     */
    private processName!: string;

    /**
     * @param {string} token
     * @param {string} suffix
     * @memberof Process
     */
    public initialize(token: string, suffix: string): void {
        this.processName = `${token}-${suffix}`;
    }

    /**
     * @param {boolean} daemon
     * @memberof Process
     */
    public stop(daemon: boolean): void {
        this.app.get<AbortMissingProcess>(Identifiers.AbortMissingProcess).execute(this.processName);
        this.app.get<AbortUnknownProcess>(Identifiers.AbortUnknownProcess).execute(this.processName);
        this.app.get<AbortStoppedProcess>(Identifiers.AbortStoppedProcess).execute(this.processName);

        const spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Stopping ${this.processName}`);

        spinner.start();

        this.processManager[daemon ? "delete" : "stop"](this.processName);

        spinner.succeed();
    }

    /**
     * @memberof Process
     */
    public restart(): void {
        this.app.get<AbortMissingProcess>(Identifiers.AbortMissingProcess).execute(this.processName);
        this.app.get<AbortStoppedProcess>(Identifiers.AbortStoppedProcess).execute(this.processName);

        const spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Restarting ${this.processName}`);

        spinner.start();

        this.processManager.restart(this.processName);

        spinner.succeed();
    }

    /**
     * @memberof Process
     */
    public status(): void {
        this.app.get<AbortMissingProcess>(Identifiers.AbortMissingProcess).execute(this.processName);

        this.app
            .get<Table>(Identifiers.Table)
            .render(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table) => {
                const app: ProcessDescription | undefined = this.processManager.describe(this.processName);

                Utils.assert.defined<ProcessDescription>(app);

                table.push([
                    app.pid,
                    app.name,
                    app.pm2_env.version,
                    app.pm2_env.status,
                    prettyTime(dayjs().diff(app.pm2_env.pm_uptime)),
                    `${app.monit.cpu}%`,
                    prettyBytes(app.monit.memory),
                ]);
            });
    }

    /**
     * @param {boolean} showErrors
     * @param {number} lines
     * @returns {Promise<void>}
     * @memberof Process
     */
    public async log(showErrors: boolean, lines: number): Promise<void> {
        this.app.get<AbortMissingProcess>(Identifiers.AbortMissingProcess).execute(this.processName);

        const proc: Record<string, any> | undefined = this.processManager.describe(this.processName);

        Utils.assert.defined<Record<string, any>>(proc);

        const file = showErrors ? proc.pm2_env.pm_err_log_path : proc.pm2_env.pm_out_log_path;

        this.app.get<Clear>(Identifiers.Clear).render();

        console.log(
            `Tailing last ${lines} lines for [${this.processName}] process (change the value with --lines option)`,
        );

        console.log((await readLastLines.read(file, lines)).trim());

        const log = new Tail(file);

        log.on("line", console.log);

        log.watch();
    }
}
