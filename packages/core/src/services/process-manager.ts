import { ExecaReturns, shellSync } from "execa";
import { ProcessDescription } from "pm2";

class ProcessManager {
    public start(opts: Record<string, any>, noDaemonMode: boolean): any {
        // @TODO implement
    }

    public stop(name: string): boolean {
        return this.execWithHandler(`pm2 stop ${name}`);
    }

    public restart(name: string): boolean {
        return this.execWithHandler(`pm2 restart ${name}`);
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

    public exists(name: string): boolean {
        try {
            const { stdout } = shellSync(`pm2 id ${name} | awk '{ print $2 }'`);

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
            shellSync(command);

            return true;
        } catch (error) {
            return false;
        }
    }
}

export const processManager = new ProcessManager();
