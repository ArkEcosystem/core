import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class AbortUnknownProcess
 */
@injectable()
export class AbortUnknownProcess {
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
     * @memberof AbortUnknownProcess
     */
    public execute(processName: string): void {
        if (this.processManager.isUnknown(processName)) {
            throw new Error(`The "${processName}" process has entered an unknown state.`);
        }
    }
}
