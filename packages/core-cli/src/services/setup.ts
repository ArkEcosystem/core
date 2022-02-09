import { sync } from "execa";
import { join } from "path";

import { injectable } from "../ioc";

@injectable()
export class Setup {
    public isGlobal(): boolean {
        try {
            const globalDir = this.getGlobalRootDir();
            return !!(globalDir && this.getLocalEntrypoint().startsWith(globalDir));
        } catch {
            return false;
        }
    }

    public getLocalEntrypoint(): string {
        return require.main!.filename;
    }

    public getGlobalEntrypoint(): string {
        return join(this.getGlobalRootDir(), "@arkecosystem/core/bin/run");
    }

    private getGlobalRootDir(): string {
        const { stdout, exitCode } = sync(`pnpm root -g dir`, { shell: true });

        if (exitCode !== 0) {
            throw new Error("Cannot determine global pNpm dir.");
        }

        return stdout;
    }
}
