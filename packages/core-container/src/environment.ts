import envPaths from "env-paths";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync, existsSync } from "fs-extra";
import { resolve } from "path";

export class Environment {
    constructor(private readonly variables: Record<string, any>) {}

    public setUp(): void {
        this.exportPaths();
        this.exportVariables();
    }

    public merge(variables: object): void {
        for (const [key, value] of Object.entries(variables)) {
            process.env[key] = value;
        }
    }

    private exportPaths(): void {
        const allowedKeys: string[] = ["data", "config", "cache", "log", "temp"];
        const paths: envPaths.Paths = envPaths(this.variables.token, { suffix: "core" });

        for (const key of allowedKeys) {
            if (paths[key]) {
                const name = `CORE_PATH_${key.toUpperCase()}`;
                let path = resolve(expandHomeDir(paths[key]));

                if (this.variables.network) {
                    path += `/${this.variables.network}`;
                }

                if (process.env[name] === undefined) {
                    process.env[name] = path;
                    ensureDirSync(path);
                }
            }
        }
    }

    private exportVariables(): void {
        process.env.CORE_TOKEN = this.variables.token;

        // Don't pollute the test environment!
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const envPath: string = expandHomeDir(`${process.env.CORE_PATH_CONFIG}/.env`);

        if (existsSync(envPath)) {
            this.merge(envfile.parseFileSync(envPath));
        }
    }
}
