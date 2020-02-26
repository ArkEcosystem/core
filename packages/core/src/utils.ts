import Table from "cli-table3";
import dottie from "dottie";
import envPaths from "env-paths";
import envfile from "envfile";
import { writeFileSync } from "fs-extra";
import { existsSync } from "fs-extra";
import { resolve } from "path";
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
        throw new Error(`No environment file found at ${envFile}`);
    }

    const env: Record<string, string | number> = envfile.parseFileSync(envFile);

    for (const [key, value] of Object.entries(variables)) {
        env[key] = value;
    }

    writeFileSync(envFile, envfile.stringifySync(env));
};

export const getCliConfig = (
    flags: Record<string, any>,
    paths: envPaths.Paths,
    defaultValue = {},
): Record<string, any> => {
    const configPaths: string[] = [`${paths.config}/app.js`, resolve(__dirname, `../bin/config/${flags.network}/app.js`)];

    let configPath: string;
    for (const path of configPaths) {
        if (existsSync(path)) {
            configPath = path;

            break;
        }
    }

    if (!configPath) {
        return defaultValue;
    }

    const key: string = `cli.${flags.suffix}.run.plugins`;
    const configuration = require(resolve(configPath));
    if (!dottie.exists(configuration, key)) {
        return defaultValue;
    }

    return dottie.get(configuration, key);
};
