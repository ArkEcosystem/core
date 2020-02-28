import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class AbortRunningProcess
 */
@injectable()
export class AbortRunningProcess {
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
     * @memberof AbortRunningProcess
     */
    public execute(processName: string): void {
        if (this.processManager.isOnline(processName)) {
            throw new Error(`The "${processName}" process is already running.`);
        }
    }
}
