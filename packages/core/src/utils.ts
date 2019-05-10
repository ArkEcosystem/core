import Table from "cli-table3";
import envfile from "envfile";
import { writeFileSync } from "fs-extra";
import { existsSync } from "fs-extra";
import { EnvironmentVars } from "./types";

export const renderTable = (head: string[], callback: any): void => {
    const table = new Table({
        head,
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    callback(table);

    console.log(table.toString());
};

export const updateEnvironmentVariables = (envFile: string, variables: EnvironmentVars): void => {
    if (!existsSync(envFile)) {
        this.error(`No environment file found at ${envFile}`);
    }

    const env: Record<string, string | number> = envfile.parseFileSync(envFile);

    for (const [key, value] of Object.entries(variables)) {
        env[key] = value;
    }

    writeFileSync(envFile, envfile.stringifySync(env));
};
