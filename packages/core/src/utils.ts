import envfile from "envfile";
import Table from "cli-table3";
import { writeFileSync } from "fs-extra";

export const renderTable = (head: string[], callback: any): void => {
    const table = new Table({
        head,
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    callback(table);

    console.log(table.toString());
};

export const updateEnvironmentVariables = (path: string, variables: Record<string, any>): void => {
    const env = envfile.parseFileSync(path);

    for (const [key, value] of Object.entries(variables)) {
    	env[key] = value;
    }

    writeFileSync(path, envfile.stringifySync(env));
};
