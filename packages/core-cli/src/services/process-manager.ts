import execa, { ExecaReturnValue, ExecaSyncReturnValue, sync } from "execa";

import { ProcessDescription, ProcessIdentifier, ProcessState } from "../contracts";
import { injectable } from "../ioc";
import { castFlagsToString } from "../utils";

/**
 * @export
 * @class ProcessManager
 */
@injectable()
export class ProcessManager {
    /**
     * @returns {ProcessDescription[]}
     * @memberof ProcessManager
     */
    public list(): ProcessDescription[] {
        try {
            const { stdout } = this.shellSync("pm2 jlist");

            if (!stdout) {
                return [];
            }

            const lastLine: string | undefined = stdout.split("\n").pop();

            if (!lastLine) {
                return [];
            }

            return Object.values(JSON.parse(lastLine));
        } catch {
            return [];
        }
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {(ProcessDescription | undefined)}
     * @memberof ProcessManager
     */
    public describe(id: ProcessIdentifier): ProcessDescription | undefined {
        const processes: ProcessDescription[] | undefined = this.list();

        if (processes.length <= 0) {
            return undefined;
        }

        return processes.find((process: ProcessDescription) => [process.id, process.name].includes(id));
    }

    /**
     * @param {Record<string, any>} opts
     * @param {Record<string, any>} [flags]
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public start(opts: Record<string, any>, flags: Record<string, any>): ExecaSyncReturnValue {
        let command: string = `pm2 start ${opts.script}`;

        if (opts.node_args) {
            command += ` --node-args="${castFlagsToString(opts.node_args)}"`;
        }

        if (flags !== undefined && Object.keys(flags).length > 0) {
            command += ` ${castFlagsToString(flags)}`;
        }

        if (opts.args) {
            command += ` -- ${opts.args}`;
        }

        return this.shellSync(command);
    }

    /**
     * @param {ProcessIdentifier} id
     * @param {Record<string, any>} [flags={}]
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public stop(id: ProcessIdentifier, flags: Record<string, any> = {}): ExecaSyncReturnValue {
        let command: string = `pm2 stop ${id}`;

        if (Object.keys(flags).length > 0) {
            command += ` ${castFlagsToString(flags)}`;
        }

        return this.shellSync(command);
    }

    /**
     * @param {ProcessIdentifier} id
     * @param {Record<string, any>} [flags={ "update-env": true }]
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public restart(id: ProcessIdentifier, flags: Record<string, any> = { "update-env": true }): ExecaSyncReturnValue {
        let command: string = `pm2 restart ${id}`;

        if (Object.keys(flags).length > 0) {
            command += ` ${castFlagsToString(flags)}`;
        }

        return this.shellSync(command);
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public reload(id: ProcessIdentifier): ExecaSyncReturnValue {
        return this.shellSync(`pm2 reload ${id}`);
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public reset(id: ProcessIdentifier): ExecaSyncReturnValue {
        return this.shellSync(`pm2 reset ${id}`);
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public delete(id: ProcessIdentifier): ExecaSyncReturnValue {
        return this.shellSync(`pm2 delete ${id}`);
    }

    /**
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public flush(): ExecaSyncReturnValue {
        return this.shellSync("pm2 flush");
    }

    /**
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public reloadLogs(): ExecaSyncReturnValue {
        return this.shellSync("pm2 reloadLogs");
    }

    /**
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public ping(): ExecaSyncReturnValue {
        return this.shellSync("pm2 ping");
    }

    /**
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    public update(): ExecaSyncReturnValue {
        return this.shellSync("pm2 update");
    }

    /**
     * @returns {Promise<ExecaReturnValue>}
     * @memberof ProcessManager
     */
    public async trigger(id: ProcessIdentifier, processActionName: string, param?: string): Promise<ExecaReturnValue> {
        return this.shell(`pm2 trigger ${id} ${processActionName} ${param}`);
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {(ProcessState | undefined)}
     * @memberof ProcessManager
     */
    public status(id: ProcessIdentifier): ProcessState | undefined {
        const process: ProcessDescription | undefined = this.describe(id);

        return process ? process.pm2_env.status : undefined;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isOnline(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Online;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isStopped(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Stopped;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isStopping(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Stopping;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isWaiting(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Waiting;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isLaunching(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Launching;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isErrored(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.Errored;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isOneLaunch(id: ProcessIdentifier): boolean {
        return this.status(id) === ProcessState.OneLaunch;
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public isUnknown(id: ProcessIdentifier): boolean {
        const processState: ProcessState | undefined = this.status(id);

        if (processState === undefined) {
            return true;
        }

        return !Object.values(ProcessState).includes(processState);
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public has(id: ProcessIdentifier): boolean {
        try {
            const { stdout } = this.shellSync(`pm2 id ${id} | awk '{ print $2 }'`);

            return !!stdout && !isNaN(Number(stdout));
        } catch {
            return false;
        }
    }

    /**
     * @param {ProcessIdentifier} id
     * @returns {boolean}
     * @memberof ProcessManager
     */
    public missing(id: ProcessIdentifier): boolean {
        return !this.has(id);
    }

    /**
     * @private
     * @param {string} command
     * @returns {Promise<ExecaReturnValue>}
     * @memberof ProcessManager
     */
    private async shell(command: string): Promise<ExecaReturnValue> {
        return execa(command, { shell: true });
    }

    /**
     * @private
     * @param {string} command
     * @returns {ExecaSyncReturnValue}
     * @memberof ProcessManager
     */
    private shellSync(command: string): ExecaSyncReturnValue {
        return sync(command, { shell: true });
    }
}
