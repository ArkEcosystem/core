import { sync } from "execa";

import { injectable } from "../ioc";

@injectable()
export class Setup {
    public isGlobal(): boolean {
        const globalDir = this.getGlobalDir();
        return !!(globalDir && this.getRootPath().startsWith(globalDir));
    }

    public getRootPath(): string {
        return require.main!.filename;
    }

    private getGlobalDir(): string | undefined {
        const { stdout, exitCode } = sync(`pnpm root -g dir`, { shell: true });

        if (exitCode === 0) {
            return stdout;
        }

        return undefined;
    }
}
