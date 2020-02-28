import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class AbortErroredProcess
 */
@injectable()
export class AbortErroredProcess {
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
     * @memberof AbortErroredProcess
     */
    public execute(processName: string): void {
        if (this.processManager.isErrored(processName)) {
            throw new Error(`The "${processName}" process has errored.`);
        }
    }
}
