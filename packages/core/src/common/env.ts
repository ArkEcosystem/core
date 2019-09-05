import envPaths, { Paths } from "env-paths";
import { resolve } from "path";

export const getEnvPaths = (token: string): Paths => envPaths(token, { suffix: "core" });

export const getPaths = (token: string, network: string): Paths => {
    let paths: Paths = getEnvPaths(token);

    for (const [key, value] of Object.entries(paths)) {
        paths[key] = `${value}/${network}`;
    }

    if (process.env.CORE_PATH_CONFIG) {
        paths = {
            ...paths,
            ...{ config: resolve(process.env.CORE_PATH_CONFIG) },
        };
    }

    if (process.env.CORE_PATH_DATA) {
        paths = {
            ...paths,
            ...{ data: resolve(process.env.CORE_PATH_DATA) },
        };
    }

    return paths;
};
