import { Application } from "../application";
import { Prompt } from "../components";
import { Identifiers, inject, injectable } from "../ioc";
import { ProcessManager } from "../services";
import { RestartProcess } from "./restart-process";

/**
 * @export
 * @class RestartRunningProcessWithPrompt
 */
@injectable()
export class RestartRunningProcessWithPrompt {
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
     * @returns {Promise<void>}
     * @memberof RestartRunningProcessWithPrompt
     */
    public async execute(processName: string): Promise<void> {
        if (this.processManager.isOnline(processName)) {
            const { confirm } = await this.app.resolve(Prompt).render([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Would you like to restart the ${processName} process?`,
                },
            ]);

            if (confirm) {
                this.app.get<RestartProcess>(Identifiers.RestartProcess).execute(processName);
            }
        }
    }
}
