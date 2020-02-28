import {
    AbortErroredProcess,
    AbortMissingProcess,
    AbortRunningProcess,
    AbortStoppedProcess,
    AbortUnknownProcess,
    DaemonizeProcess,
    RestartProcess,
    RestartRunningProcess,
    RestartRunningProcessWithPrompt,
} from "./actions";
import { Application, ProcessOptions } from "./contracts";
import { Identifiers, inject, injectable } from "./ioc";

/**
 * @export
 * @class ActionFactory
 */
@injectable()
export class ActionFactory {
    /**
     * @private
     * @type {Application}
     * @memberof ActionFactory
     */
    @inject(Identifiers.Application)
    protected readonly app!: Application;

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public abortErroredProcess(processName: string): void {
        return this.app.get<AbortErroredProcess>(Identifiers.AbortErroredProcess).execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public abortMissingProcess(processName: string): void {
        return this.app.get<AbortMissingProcess>(Identifiers.AbortMissingProcess).execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public abortRunningProcess(processName: string): void {
        return this.app.get<AbortRunningProcess>(Identifiers.AbortRunningProcess).execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public abortStoppedProcess(processName: string): void {
        return this.app.get<AbortStoppedProcess>(Identifiers.AbortStoppedProcess).execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public abortUnknownProcess(processName: string): void {
        return this.app.get<AbortUnknownProcess>(Identifiers.AbortUnknownProcess).execute(processName);
    }

    /**
     * @param {ProcessOptions} options
     * @param {*} flags
     * @returns {Promise<void>}
     * @memberof ActionFactory
     */
    public async daemonizeProcess(options: ProcessOptions, flags): Promise<void> {
        return this.app.get<DaemonizeProcess>(Identifiers.DaemonizeProcess).execute(options, flags);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public restartProcess(processName: string): void {
        return this.app.get<RestartProcess>(Identifiers.RestartProcess).execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {Promise<void>}
     * @memberof ActionFactory
     */
    public async restartRunningProcessWithPrompt(processName: string): Promise<void> {
        return this.app
            .get<RestartRunningProcessWithPrompt>(Identifiers.RestartRunningProcessWithPrompt)
            .execute(processName);
    }

    /**
     * @param {string} processName
     * @returns {void}
     * @memberof ActionFactory
     */
    public restartRunningProcess(processName: string): void {
        return this.app.get<RestartRunningProcess>(Identifiers.RestartRunningProcess).execute(processName);
    }
}
