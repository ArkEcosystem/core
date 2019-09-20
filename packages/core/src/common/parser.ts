import { existsSync, readdirSync } from "fs-extra";
import prompts from "prompts";

import { abort } from "./cli";
import { configManager } from "./config-manager";
import { getEnvPaths, getPaths } from "./env";
import { isValidNetwork } from "./networks";

export const parseWithNetwork = async ({ args, flags }): Promise<any> => {
    if (!flags.token) {
        flags.token = configManager.get("token");
    }

    if (!flags.network) {
        let config: string = getEnvPaths(flags.token).config;

        /* istanbul ignore else */
        if (process.env.CORE_PATH_CONFIG) {
            config = process.env.CORE_PATH_CONFIG;
        }

        if (!existsSync(config)) {
            abort(`The given config "${config}" does not exist.`);
        }

        const folders: string[] = readdirSync(config);

        if (!folders || folders.length === 0) {
            abort('We were unable to detect any configuration. Please run "ark config:publish" and try again.');
        }

        if (folders.length === 1) {
            flags.network = folders[0];
        } else {
            const response = await prompts([
                {
                    type: "select",
                    name: "network",
                    message: "What network do you want to operate on?",
                    choices: folders
                        .filter(folder => isValidNetwork(folder))
                        .map(folder => ({ title: folder, value: folder })),
                },
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                },
            ]);

            if (!response.confirm) {
                abort("You'll need to confirm the network to continue.");
            }

            if (!isValidNetwork(response.network)) {
                abort(`The given network "${response.network}" is not valid.`);
            }

            flags.network = response.network;
        }
    }

    return { args, flags, paths: getPaths(flags.token, flags.network) };
};
