import { Application } from "../application";
import { Spinner } from "../components";
import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";

/**
 * @export
 * @class RestartProcess
 */
@injectable()
export class RestartProcess {
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
     * @memberof RestartProcess
     */
    public execute(processName: string): void {
        let spinner;
        try {
            spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Restarting ${processName}`);

            this.processManager.restart(processName);
        } catch (error) {
            throw new Error(error.stderr ? `${error.message}: ${error.stderr}` : error.message);
        } finally {
            spinner.stop();
        }
    }
}
