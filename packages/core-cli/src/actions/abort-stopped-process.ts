import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class AbortStoppedProcess
 */
@injectable()
export class AbortStoppedProcess {
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
     * @memberof AbortStoppedProcess
     */
    public execute(processName: string): void {
        if (this.processManager.isStopped(processName)) {
            throw new Error(`The "${processName}" process is not running.`);
        }
    }
}
