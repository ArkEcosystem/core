import { ExecaReturns, shellSync } from "execa";
import { ProcessState } from "./enums";
import { ProcessDescription } from "./types";

class ProcessManager {
    public start(opts: Record<string, any>, noDaemonMode: boolean): any {
        const flags = ["--max-restarts=5", "--kill-timeout=30000"];

        if (noDaemonMode) {
            flags.push("--no-daemon");
        }

        return this.exec(`pm2 --name ${opts.name} ${flags.join(" ")} start ${opts.script} -- ${opts.args}`);
    }

    public stop(name: string): boolean {
        return this.execWithHandler(`pm2 stop ${name}`);
    }

    public restart(name: string): boolean {
        return this.execWithHandler(`pm2 reload ${name} --update-env`);
    }

    public delete(name: string): boolean {
        return this.execWithHandler(`pm2 delete ${name}`);
    }

    public describe(name: string): any {
        try {
            const { stdout } = this.exec("pm2 jlist");

            return JSON.parse(stdout).find(p => p.name === name);
        } catch (error) {
            return false;
        }
    }

    public status(name: string): any {
        try {
            return processManager.describe(name).pm2_env.status;
        } catch (error) {
            return false;
        }
    }

    public isRunning(name: string): boolean {
        return this.status(name) === ProcessState.Online;
    }

    public hasStopped(name: string): boolean {
        return this.status(name) === ProcessState.Stopped;
    }

    public hasErrored(name: string): boolean {
        return this.status(name) === ProcessState.Errored;
    }

    public hasUnknownState(name: string): boolean {
        return !Object.values(ProcessState).includes(this.status(name));
    }

    public exists(name: string): boolean {
        try {
            const { stdout } = this.exec(`pm2 id ${name} | awk '{ print $2 }'`);

            return !!stdout;
        } catch (error) {
            return false;
        }
    }

    public list(token: string): any {
        try {
            const { stdout } = this.exec("pm2 jlist");

            return Object.values(JSON.parse(stdout)).filter((p: ProcessDescription) => p.name.startsWith(token));
        } catch (error) {
            return false;
        }
    }

    private exec(command: string): ExecaReturns {
        return shellSync(command);
    }

    private execWithHandler(command: string): boolean {
        try {
            this.exec(command);

            return true;
        } catch (error) {
            return false;
        }
    }
}

export const processManager = new ProcessManager();
