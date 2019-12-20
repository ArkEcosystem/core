import { Application } from "../application";
import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";
import { RestartProcess } from "./restart-process";

/**
 * @export
 * @class RestartRunningProcess
 */
@injectable()
export class RestartRunningProcess {
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
     * @param {string} processName
     * @memberof RestartRunningProcess
     */
    public execute(processName: string): void {
        if (this.processManager.isOnline(processName)) {
            this.app.get<RestartProcess>(Identifiers.RestartProcess).execute(processName);
        }
    }
}
