import { totalmem } from "os";

import { Application } from "../application";
import { Spinner } from "../components";
import { ProcessOptions } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";
import { AbortRunningProcess } from "./abort-running-process";
import { AbortUnknownProcess } from "./abort-unknown-process";

/**
 * @export
 * @class DaemonizeProcess
 */
@injectable()
export class DaemonizeProcess {
    /**
     * @private
     * @type {Application}
     * @memberof Command
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
     * @static
     * @param {ProcessOptions} options
     * @param {*} flags
     * @memberof DaemonizeProcess
     */
    public execute(options: ProcessOptions, flags): void {
        const processName: string = options.name;

        if (this.processManager.has(processName)) {
            this.app.get<AbortRunningProcess>(Identifiers.AbortUnknownProcess).execute(processName);
            this.app.get<AbortUnknownProcess>(Identifiers.AbortRunningProcess).execute(processName);
        }

        let spinner;
        try {
            spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Starting ${processName}`);

            const flagsProcess: Record<string, boolean | number | string> = {
                "max-restarts": 5,
                "kill-timeout": 30000,
            };

            if (flags.daemon !== true) {
                flagsProcess["no-daemon"] = true;
            }

            flagsProcess.name = processName;

            const potato: boolean = totalmem() < 2 * 1024 ** 3;

            this.processManager.start(
                {
                    ...options,
                    ...{
                        env: {
                            NODE_ENV: "production",
                            CORE_ENV: flags.env,
                        },
                        node_args: potato ? { max_old_space_size: 500 } : undefined,
                    },
                },
                flagsProcess,
            );
        } catch (error) {
            throw new Error(error.stderr ? `${error.message}: ${error.stderr}` : error.message);
        } finally {
            spinner.stop();
        }
    }
}
